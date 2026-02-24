<?php
class ConfigService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getSettings() {
        $query = "SELECT setting_key, setting_value FROM settings";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }

    public function updateSettings($settings) {
        foreach ($settings as $key => $value) {
            $query = "INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) 
                      ON DUPLICATE KEY UPDATE setting_value = :val2";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':val', $value);
            $stmt->bindParam(':val2', $value);
            $stmt->execute();
        }
    }

    public function getBranches() {
        $query = "SELECT * FROM branches";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateBranch($data) {
        if ($data->id === 'new') {
            $query = "INSERT INTO branches (name, address) VALUES (:name, :addr)";
            $stmt = $this->db->prepare($query);
        } else {
            $query = "UPDATE branches SET name = :name, address = :addr WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $data->id);
        }
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':addr', $data->address);
        $stmt->execute();
    }

    public function deleteBranch($id) {
        $query = "DELETE FROM branches WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }
}
?>
