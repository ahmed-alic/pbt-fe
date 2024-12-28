USE personalbudgettracker;

-- Create category table
CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);

-- Create budget_goal table
CREATE TABLE IF NOT EXISTS budget_goal (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    amount DOUBLE NOT NULL,
    current_spending DOUBLE DEFAULT 0,
    time_period VARCHAR(255) NOT NULL
);

-- Create transaction table
CREATE TABLE IF NOT EXISTS transaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    amount DOUBLE NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    category_id BIGINT,
    budgetgoal_id BIGINT,
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (budgetgoal_id) REFERENCES budget_goal(id)
);
