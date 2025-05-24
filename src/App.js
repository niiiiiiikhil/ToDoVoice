import React, { useState, useEffect } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;

const speak = (message) => {
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
};

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("siriTasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    localStorage.setItem("siriTasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskText) => {
    if (taskText.trim() !== "") {
      setTasks([...tasks, { text: taskText, done: false }]);
      speak(`Got it. I added: ${taskText}`);
    }
  };

  const deleteTask = (index) => {
    const taskText = tasks[index]?.text || "that task";
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    speak(`Alright, I removed ${taskText}`);
  };

  const toggleDone = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
    speak(`Marked task ${index + 1} as ${updated[index].done ? "done" : "not done"}`);
  };

  const extractNumber = (text) => {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : -1;
  };

  const extractTask = (text, pattern) => {
    return text.replace(pattern, "").trim();
  };

  const parseIntent = (speech) => {
    const clean = speech.toLowerCase();

    const addPattern = /(remind( me)? to|add|i need to|i should|remember to|i have to|note to self|schedule|create|i must|please add|gotta|need to|have to|make sure to|i want to|better|plan to)/gi;
    const deletePattern = /(delete|get rid of|remove|erase|forget|trash|cancel|drop)\s?(task)?\s?\d+/;
    const completePattern = /(done|finished|i did|i completed|complete|check off|mark|that's done|just did|yep, that’s done|mark task)\s?\d+/;
    const clearPattern = /(clear everything|nuke the list|reset all|wipe everything|start fresh|empty the list)/;
    const helpPattern = /(what can i say|help|voice guide|how do i|instructions|show me how)/;
    const lastPattern = /(last one|that one|previous task)/;

    if (clean.match(addPattern)) return { intent: "add", content: extractTask(clean, addPattern) };
    if (clean.match(deletePattern)) return { intent: "delete", index: extractNumber(clean) };
    if (clean.match(completePattern)) return { intent: "complete", index: extractNumber(clean) };
    if (clean.match(clearPattern)) return { intent: "clear" };
    if (clean.match(helpPattern)) return { intent: "help" };
    if (clean.match(lastPattern)) return { intent: "last" };

    return { intent: "unknown" };
  };

  const handleVoice = () => {
    recognition.start();
    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      setTranscript(speech);
      console.log("Voice input:", speech);

      const result = parseIntent(speech);

      switch (result.intent) {
        case "add":
          addTask(result.content);
          break;
        case "delete":
          if (result.index > 0 && result.index <= tasks.length) {
            deleteTask(result.index - 1);
          }
          break;
        case "complete":
          if (result.index > 0 && result.index <= tasks.length) {
            toggleDone(result.index - 1);
          }
          break;
        case "clear":
          setTasks([]);
          speak("Your list is now empty.");
          break;
        case "help":
          speak("Try saying: I need to buy milk. Delete task 2. Mark task 1 done. Or clear everything.");
          break;
        case "last":
          const lastIndex = tasks.length - 1;
          if (lastIndex >= 0) {
            toggleDone(lastIndex);
            speak("Marked your last task as done.");
          }
          break;
        default:
          speak("I didn't quite catch that. Try saying something like: I need to buy groceries.");
      }
    };
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🧠 Siri-Style Natural Voice Task Manager</h2>

      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task"
          style={styles.input}
        />
        <button onClick={() => addTask(input)} style={styles.button}>Add</button>
        <button onClick={handleVoice} style={styles.button}>🎤 Speak</button>
      </div>

      {transcript && (
        <p style={styles.transcript}>🗣️ You said: <em>{transcript}</em></p>
      )}

      <ul style={styles.list}>
        {tasks.map((task, index) => (
          <li key={index} style={styles.listItem}>
            <span
              onClick={() => toggleDone(index)}
              style={{
                textDecoration: task.done ? "line-through" : "none",
                cursor: "pointer",
                color: task.done ? "green" : "#333",
              }}
            >
              {index + 1}. {task.text}
            </span>
            <button onClick={() => deleteTask(index)} style={styles.delete}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },
  input: {
    padding: "10px",
    width: "60%",
    marginRight: "10px",
  },
  button: {
    padding: "10px 15px",
  },
  transcript: {
    marginTop: "10px",
    color: "#666",
  },
  list: {
    listStyle: "none",
    padding: 0,
    marginTop: "20px",
  },
  listItem: {
    marginBottom: "10px",
  },
  delete: {
    marginLeft: "10px",
    backgroundColor: "#ffcccc",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
  },
};

export default App;
