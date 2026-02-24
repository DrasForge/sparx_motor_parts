<?php
class UserService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAllUsers() {
        $query = "SELECT id, username, role, branch_id FROM users";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createUser($data) {
        $query = "INSERT INTO users (username, password_hash, role, branch_id) 
                  VALUES (:username, :password, :role, :branch_id)";
        $stmt = $this->db->prepare($query);
        $hashed = password_hash($data->password, PASSWORD_DEFAULT);
        $stmt->bindParam(':username', $data->username);
        $stmt->bindParam(':password', $hashed);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':branch_id', $data->branch_id);
        $stmt->execute();
    }

    public function updateUser($id, $data) {
        $query = "UPDATE users SET username = :username, role = :role, branch_id = :branch_id";
        if (!empty($data->password)) {
            $query .= ", password_hash = :password";
        }
        $query .= " WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':branch_id', $data->branch_id);
        $stmt->bindParam(':id', $id);
        
        if (!empty($data->password)) {
            $hashed = password_hash($data->password, PASSWORD_DEFAULT);
            $stmt->bindParam(':password', $hashed);
        }
        
        $stmt->execute();
    }

    public function deleteUser($id) {
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }
}
?>
