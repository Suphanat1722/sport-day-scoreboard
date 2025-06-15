// ใส่ข้อมูล firebaseConfig ที่คัดลอกมาตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyBr4X2dokqZ9T5Kz8AEhJ7TkT10-e95UiA",
  authDomain: "sport-day-scoreboard.firebaseapp.com",
  databaseURL: "https://sport-day-scoreboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sport-day-scoreboard",
  storageBucket: "sport-day-scoreboard.firebasestorage.app",
  messagingSenderId: "230611168156",
  appId: "1:230611168156:web:62f3d8761dbe0d698fb659",
  measurementId: "G-P386LC78C2"
};

// เริ่มต้นการเชื่อมต่อ Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const scoresRef = database.ref('scores');

// --- ส่วนของการแสดงผล (สำหรับ index.html) ---
// ไม่มีการเปลี่ยนแปลงในส่วนนี้
if (document.querySelector('.scoreboard')) {
    scoresRef.on('value', (snapshot) => {
        const scores = snapshot.val() || { red: 0, blue: 0, green: 0, yellow: 0 };
        document.getElementById('score-red').innerText = scores.red || 0;
        document.getElementById('score-blue').innerText = scores.blue || 0;
        document.getElementById('score-green').innerText = scores.green || 0;
        document.getElementById('score-yellow').innerText = scores.yellow || 0;
    });
}

// --- ส่วนของแผงควบคุม (สำหรับ admin.html) ---
// ส่วนนี้ถูกเขียนขึ้นมาใหม่ทั้งหมด
if (document.querySelector('.admin-grid')) {
    const adminGrid = document.querySelector('.admin-grid');
    const statusMessage = document.getElementById('status-message');

    // 1. แสดงคะแนนปัจจุบันบนหน้าแผงควบคุม
    scoresRef.on('value', (snapshot) => {
        const scores = snapshot.val() || {};
        document.getElementById('current-score-red').innerText = scores.red || 0;
        document.getElementById('current-score-blue').innerText = scores.blue || 0;
        document.getElementById('current-score-green').innerText = scores.green || 0;
        document.getElementById('current-score-yellow').innerText = scores.yellow || 0;
    });

    // 2. จัดการการคลิกบนปุ่มทั้งหมดใน Grid
    adminGrid.addEventListener('click', (event) => {
        // เช็คว่าที่คลิกเป็นปุ่มหรือไม่
        if (event.target.tagName !== 'BUTTON') return;

        const button = event.target;
        const team = button.dataset.team;
        const action = button.dataset.action;

        if (action === 'set') {
            // กรณีเป็นการ "ตั้งค่า" คะแนน
            const input = document.getElementById(`input-${team}`);
            const newScore = parseInt(input.value, 10);

            if (isNaN(newScore)) {
                showStatus(`กรุณาใส่คะแนนของสี ${team} เป็นตัวเลข`, 'error');
                return;
            }
            
            // ใช้ set() เพื่อเขียนทับค่าเก่า
            database.ref(`scores/${team}`).set(newScore)
                .then(() => {
                    showStatus(`ตั้งค่าคะแนนสี ${team} เป็น ${newScore} สำเร็จ`);
                    input.value = ''; // เคลียร์ช่อง input
                })
                .catch(err => showStatus(`เกิดข้อผิดพลาด: ${err.message}`, 'error'));

        } else {
            // กรณีเป็นการ "เพิ่ม" คะแนน
            const pointsToAdd = parseInt(button.dataset.points, 10);
            
            // ใช้ transaction เพื่อบวกค่าเก่าอย่างปลอดภัย
            const teamScoreRef = database.ref(`scores/${team}`);
            teamScoreRef.transaction((currentScore) => {
                return (currentScore || 0) + pointsToAdd;
            })
            .then(() => {
                showStatus(`เพิ่ม ${pointsToAdd} คะแนนให้สี ${team} สำเร็จ`);
            })
            .catch(err => showStatus(`เกิดข้อผิดพลาด: ${err.message}`, 'error'));
        }
    });

    // ฟังก์ชันสำหรับแสดงข้อความสถานะ
    let statusTimeout;
    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2c3e50';
        statusMessage.classList.add('show');
        
        clearTimeout(statusTimeout);
        statusTimeout = setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 3000); // แสดงข้อความเป็นเวลา 3 วินาที
    }
}