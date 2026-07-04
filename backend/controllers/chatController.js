const { serverError } = require('../utils/errors');
const pool = require('../config/db');

const conversationSelect = `
  SELECT c.*,
         a.title AS apartment_title,
         a.location AS apartment_location,
         tourist.name AS tourist_name,
         owner.name AS owner_name,
         last_msg.body AS last_message,
         last_msg.created_at AS last_message_at,
         COALESCE(unread.count, 0) AS unread_count
  FROM conversations c
  JOIN apartments a ON a.id = c.apartment_id
  JOIN users tourist ON tourist.id = c.tourist_id
  JOIN users owner ON owner.id = c.owner_id
  LEFT JOIN LATERAL (
    SELECT body, created_at
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS count
    FROM messages
    WHERE conversation_id = c.id
      AND sender_id <> $1
      AND read_at IS NULL
  ) unread ON true
`;

const ensureParticipant = async (conversationId, userId) => {
  const result = await pool.query(
    'SELECT * FROM conversations WHERE id = $1 AND (tourist_id = $2 OR owner_id = $2)',
    [conversationId, userId]
  );
  return result.rows[0];
};

const getConversations = async (req, res) => {
  try {
    const result = await pool.query(`
      ${conversationSelect}
      WHERE c.tourist_id = $1 OR c.owner_id = $1
      ORDER BY COALESCE(last_msg.created_at, c.updated_at) DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
};

const startConversation = async (req, res) => {
  const { apartment_id, message, tourist_id } = req.body;

  try {
    const apt = await pool.query(
      'SELECT id, owner_id FROM apartments WHERE id = $1',
      [apartment_id]
    );
    if (apt.rows.length === 0) return res.status(404).json({ error: 'Apartment not found.' });

    const ownerId = apt.rows[0].owner_id;

    // The owner of the apartment can open/create a conversation with a specific
    // tourist (e.g. from the reservations list). Anyone else starts a
    // conversation with the apartment's owner, as before.
    let finalTouristId;
    if (req.user.id === ownerId) {
      if (!tourist_id) return res.status(400).json({ error: 'tourist_id is required.' });
      finalTouristId = tourist_id;
    } else {
      finalTouristId = req.user.id;
    }

    if (finalTouristId === ownerId) {
      return res.status(400).json({ error: 'You cannot start a chat with yourself.' });
    }

    const result = await pool.query(`
      INSERT INTO conversations (apartment_id, tourist_id, owner_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (apartment_id, tourist_id, owner_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING *
    `, [apartment_id, finalTouristId, ownerId]);

    const conversation = result.rows[0];
    if (message && message.trim()) {
      await pool.query(
        'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
        [conversation.id, req.user.id, message.trim()]
      );
    }

    res.status(201).json(conversation);
  } catch (err) {
    serverError(res, err);
  }
};

const getMessages = async (req, res) => {
  const { id } = req.params;
  try {
    const conversation = await ensureParticipant(id, req.user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    await pool.query(
      'UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL',
      [id, req.user.id]
    );

    const result = await pool.query(`
      SELECT m.*, u.name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    serverError(res, err);
  }
};

const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;

  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

  try {
    const conversation = await ensureParticipant(id, req.user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const result = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, req.user.id, body.trim()]);

    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    serverError(res, err);
  }
};

module.exports = { getConversations, startConversation, getMessages, sendMessage };
