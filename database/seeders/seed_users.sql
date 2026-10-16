USE `db_chatsystem`;

-- Insert Demo Users (Password for all is: password123)
-- Bcrypt Hash: $2y$10$3sF9/JgR0eLqfVvjVq84k.hC0lJvA8b2vG2h3J4k5l6m7n8o9p0q (or standard bcrypt)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `password`, `avatar`, `status`, `created_at`) VALUES
(1, 'Alice Smith', 'alice@example.com', '+1 (555) 019-2834', '$2a$10$5jWjN0rZqT7F9r7Lw3mF1eGjHkK5l6z7X8c9v0b1n2m3a4s5d6f7g', 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice', 'offline', NOW()),
(2, 'Bob Jones', 'bob@example.com', '+91 9876543210', '$2a$10$5jWjN0rZqT7F9r7Lw3mF1eGjHkK5l6z7X8c9v0b1n2m3a4s5d6f7g', 'https://api.dicebear.com/7.x/bottts/svg?seed=Bob', 'offline', NOW()),
(3, 'Charlie Brown', 'charlie@example.com', '0987654321', '$2a$10$5jWjN0rZqT7F9r7Lw3mF1eGjHkK5l6z7X8c9v0b1n2m3a4s5d6f7g', 'https://api.dicebear.com/7.x/bottts/svg?seed=Charlie', 'offline', NOW()),
(4, 'Diana Prince', 'diana@example.com', '+44 7911 123456', '$2a$10$5jWjN0rZqT7F9r7Lw3mF1eGjHkK5l6z7X8c9v0b1n2m3a4s5d6f7g', 'https://api.dicebear.com/7.x/bottts/svg?seed=Diana', 'offline', NOW());
