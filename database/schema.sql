CREATE DATABASE IF NOT EXISTS mente_turbo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mente_turbo;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(40) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type ENUM('aluno', 'professor') NOT NULL DEFAULT 'aluno',
    points INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY users_email_unique (email),
    KEY users_ranking (points, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_state (
    user_id BIGINT UNSIGNED NOT NULL,
    state_key VARCHAR(120) NOT NULL,
    state_value LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, state_key),
    CONSTRAINT user_state_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    legacy_id VARCHAR(80) NULL,
    teacher_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    prompt VARCHAR(240) NOT NULL,
    answer DECIMAL(16, 6) NOT NULL,
    student_answer DECIMAL(16, 6) NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY activities_legacy_id_unique (legacy_id),
    KEY activities_teacher (teacher_id, created_at),
    KEY activities_student (student_id, created_at),
    CONSTRAINT activities_teacher_fk
        FOREIGN KEY (teacher_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT activities_student_fk
        FOREIGN KEY (student_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
