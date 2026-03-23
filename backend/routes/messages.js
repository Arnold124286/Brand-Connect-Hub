const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/messages/conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT ON (other_user)
         CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AS other_user,
         content AS last_message, created_at, project_id,
         (SELECT full_name FROM users WHERE uid = CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END) AS other_name,
         (SELECT avatar_url FROM users WHERE uid = CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END) AS other_avatar,
         (SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND sender_id = CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END AND is_read=FALSE) AS unread_count
       FROM messages WHERE sender_id=$1 OR receiver_id=$1
       ORDER BY other_user, created_at DESC`,
      [req.user.uid]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/messages/:userId
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON u.uid = m.sender_id
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC LIMIT 100`,
      [req.user.uid, req.params.userId]
    );
    // Mark as read
    await db.query('UPDATE messages SET is_read=TRUE WHERE receiver_id=$1 AND sender_id=$2', [req.user.uid, req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages
router.post('/', authenticate, async (req, res) => {
  const { receiverId, content, projectId } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content, project_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.uid, receiverId, content, projectId || null]
    );
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, meta) VALUES ($1,$2,$3,$4,$5)`,
      [receiverId, 'new_message', 'New Message', `You have a new message from ${req.user.email}`,
       JSON.stringify({ senderId: req.user.uid })]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
