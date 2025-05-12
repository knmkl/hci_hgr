import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';

const animals = ["🦁", "🐰", "🐶", "🐱", "🐸", "🐵", "🐼"];
const totalLevels = 5;

function LearnPage() {
  const navigate = useNavigate();
  const [randomAnimal, setRandomAnimal] = useState("🦁");
  const [randomCount, setRandomCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  const videoRef = useRef(null);
  const [image, setImage] = useState(null);
  const streamRef = useRef(null); // stream хадгалах

  const generateChallenge = () => {
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const count = Math.floor(Math.random() * 5) + 1;
    setRandomAnimal(animal);
    setRandomCount(count);
    setUserAnswer("");
    setResult("");
    setCanRetry(false);
    setImage(null);
  };

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Камер асаахад алдаа:", err);
      }
    };

    generateChallenge();
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setImage(dataUrl);
  };

  const sendToServer = async () => {
    if (!image) return;
    try {
      const response = await fetch("http://127.0.0.1:5000/process_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) throw new Error("Серверээс амжилтгүй хариу ирлээ");

      const data = await response.json();
      const total = data.total;
      setUserAnswer(total.toString());
      handleCheck(total.toString());
    } catch (error) {
      console.error("Илгээхэд алдаа:", error);
      setResult("⚠️ Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const handleCheck = (overrideAnswer = null) => {
    const answer = overrideAnswer ?? userAnswer;
    if (parseInt(answer) === randomCount) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setResult("🎉 Зөв байна!");
      if (nextLevel === totalLevels) {
        setGameWon(true);
      } else {
        setTimeout(() => {
          generateChallenge();
        }, 1000);
      }
    } else {
      setResult("😅 Буруу байна. Дахин оролдоорой!");
      setCanRetry(true);
    }
  };

  const handleStop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    navigate('/page1/pause');
  };

  const progressWidth = `${(level / totalLevels) * 100}%`;

  if (gameWon) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>🎉 Та бүх түвшинг амжилттай давлаа!</h2>
        <button onClick={() => navigate("/")}>🏠 Нүүр хуудас руу очих</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>🦊 Амьтдыг тоолоорой!</h2>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "20px",
      }}>
        <div style={{ flex: 1 }}>
          {[...Array(randomCount)].map((_, i) => (
            <span key={i} style={{ fontSize: "60px" }}>{randomAnimal}</span>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <video ref={videoRef} autoPlay width="320" height="240" style={{ border: "2px solid black", transform: "scaleX(-1)", }} />
          <div style={{ marginTop: "10px" }}>
            <button onClick={captureImage}>📸 Зураг авах</button>
            <button onClick={sendToServer} style={{ marginLeft: "10px" }} disabled={!image}>🧠 Илгээх</button>
          </div>
        </div>

        <div style={{ flex: 1 }}> 
          <input
            type="number"
            placeholder="Хэд гэж бодож байна?"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            style={{ padding: "10px", fontSize: "18px", borderRadius: "10px", width: "100%" }}
          />
          <button
            onClick={() => handleCheck()}
            style={{ marginTop: "10px", padding: "10px", width: "100%" }}
          >
            Шалгах
          </button>
        </div>
      </div>

      {result && <p style={{ fontSize: "20px" }}>{result}</p>}

      <div style={{ background: "#eee", height: "20px", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{
          width: progressWidth,
          height: "100%",
          background: "#b48efb",
          transition: "width 0.3s",
        }} />
      </div>

      <div style={{
        marginTop: "20px",
        display: "flex",
        justifyContent: "center"
      }}>
        <button
          onClick={handleStop}
          title="Зогсоох"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#eee',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ⏸️
        </button>
      </div>
    </div>
  );
}

export default LearnPage;

