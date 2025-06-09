import React, { useState, useRef } from "react";
import AnimatedBackground from "./components/AnimatedBackground";

function VideoRecorder() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const videoRef = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          setVideoBlob(e.data);
          setVideoUrl(URL.createObjectURL(e.data));
        };
        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      })
      .catch((error) => {
        console.error("Ошибка доступа к камере", error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setRecording(false);
  };

  const sendVideoToTelegram = async () => {
    const formData = new FormData();
    formData.append("chat_id", "7819537579"); // Замените на ID вашего чата
    formData.append("video", videoBlob, "video.webm"); // Видео, которое отправляем

    const response = await fetch(
      `https://api.telegram.org/bot7994259922:AAFg95V-vIqovZXU8RXQfeo9TC91Bu3ppK8/sendVideo`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.ok) {
      alert("Видео успешно отправлено в Telegram");
    } else {
      const error = await response.json();
      console.error("Ошибка при отправке видео:", error);
      alert("Произошла ошибка при отправке видео");
    }
  };

  return (
    <div>
      <AnimatedBackground />
      <h1>Запись видео с камеры</h1>
      <video ref={videoRef} width="640" height="480" autoPlay />
      <div>
        {recording ? (
          <button onClick={stopRecording}>Остановить запись</button>
        ) : (
          <button onClick={startRecording}>Начать запись</button>
        )}
      </div>
      {videoUrl && (
        <div>
          <h2>Ваше видео:</h2>
          <video src={videoUrl} controls width="640" />
          <div>
            <button onClick={sendVideoToTelegram}>
              Отправить видео в Telegram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
