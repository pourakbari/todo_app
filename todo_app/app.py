from flask import Flask, jsonify, request, render_template
import sqlite3

app = Flask(__name__)

DATABASE = "database.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/tasks")
def get_tasks():
    conn = get_db()

    tasks = conn.execute(
        "SELECT * FROM tasks ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([
        {
            "id": task["id"],
            "title": task["title"],
            "completed": bool(task["completed"])
        }
        for task in tasks
    ])


@app.post("/api/tasks")
def create_task():
    data = request.get_json()

    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    conn = get_db()

    cursor = conn.execute(
        "INSERT INTO tasks (title) VALUES (?)",
        (title,)
    )

    conn.commit()

    task_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "id": task_id,
        "title": title,
        "completed": False
    }), 201


@app.patch("/api/tasks/<int:task_id>")
def toggle_task(task_id):
    conn = get_db()

    task = conn.execute(
        "SELECT * FROM tasks WHERE id = ?",
        (task_id,)
    ).fetchone()

    if task is None:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    new_status = 0 if task["completed"] else 1

    conn.execute(
        "UPDATE tasks SET completed = ? WHERE id = ?",
        (new_status, task_id)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "id": task_id,
        "completed": bool(new_status)
    })


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    conn = get_db()

    cursor = conn.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"success": True})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)