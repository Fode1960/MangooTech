-- Query to check current shops and their status
SELECT 
    s.id,
    s.name,
    s.status,
    s.created_at,
    s.owner_id,
    u.email as owner_email,
    u.first_name,
    u.last_name
FROM shops s
JOIN users u ON s.owner_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;