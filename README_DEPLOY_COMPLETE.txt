ESCAPE TO CHANGE — COMPLETE WEB v1.1.0
======================================

Game developer / ผู้พัฒนาเกม:
Chaiyaset Promsri
© 2026 Chaiyaset Promsri. All rights reserved. สงวนลิขสิทธิ์

โครงสร้าง
---------
public/index.html          เกมสำหรับนักศึกษา
public/teacher.html        Teacher Dashboard
netlify/functions/...      Backend Functions
netlify.toml               Netlify configuration
package.json               @netlify/blobs dependency

สิ่งที่เวอร์ชันนี้เพิ่มจาก Production v1.0
-------------------------------------------
- ไม่เปลี่ยน game flow / room logic / character style ที่ใช้งานได้แล้ว
- ระบุ Game Developer และ Copyright หน้าแรกอย่างชัดเจน
- ส่ง Final Result เข้าระบบกลางอัตโนมัติเมื่อจบเกม
- ถ้าส่งไม่สำเร็จ นักศึกษายังเห็น Final Dashboard และกด Retry / ดาวน์โหลด JSON สำรองได้
- Teacher Dashboard รวมผลนักศึกษาหลายเครื่อง
- Teacher Dashboard ดาวน์โหลด CSV ได้
- Classroom Mode เก็บชื่อ + Student ID สำหรับการจัดการชั้นเรียน
- Research Mode ลบชื่อและ Student ID ก่อนบันทึก และใช้ pseudonymous participant ID
- ใช้ Netlify Functions + Netlify Blobs

ENVIRONMENT VARIABLES ที่ต้องตั้งใน Netlify
----------------------------------------------
1) ETC_ADMIN_TOKEN
   - รหัสลับสำหรับเปิด Teacher Dashboard
   - ตั้งเป็นข้อความสุ่มยาวอย่างน้อยประมาณ 24–32 ตัวอักษร
   - ห้ามส่งรหัสนี้ให้นักศึกษา

2) ETC_RESEARCH_SALT
   - รหัสสุ่มสำหรับสร้าง pseudonymous ID ใน Research Mode
   - ควรเป็นข้อความสุ่มยาว
   - หากไม่ใช้ Research Mode ก็ยังควรตั้งไว้เพื่อให้พร้อมใช้งาน

สำคัญ:
Environment Variables ต้องตั้งใน Netlify UI และให้ Functions เข้าถึงได้
อย่าใส่ secret ลงในไฟล์ netlify.toml หรือ JavaScript หน้าเว็บ

DEPLOY แบบแนะนำ
----------------
วิธีที่เสถียรสำหรับเวอร์ชันที่มี Functions คือ:
A) สร้าง GitHub repository ใหม่
B) อัปโหลดโฟลเดอร์นี้ทั้งหมดเข้า repository
C) ใน Netlify เลือก Add new project > Import an existing project > GitHub
D) เลือก repository นี้
E) Netlify จะอ่าน netlify.toml:
   Publish directory = public
   Functions directory = netlify/functions
F) ตั้ง Environment Variables สองตัวด้านบน
G) Deploy
H) ทดสอบ:
   https://YOUR-SITE.netlify.app/api/health
   https://YOUR-SITE.netlify.app/
   https://YOUR-SITE.netlify.app/teacher.html

Teacher Dashboard
-----------------
เปิด /teacher.html
ใส่ค่าเดียวกับ ETC_ADMIN_TOKEN
Token ถูกเก็บใน sessionStorage ของ browser tab/session เท่านั้น

Data flow
---------
Student browser
  -> Final Dashboard
  -> POST /api/submit-result
  -> Netlify Function
  -> Netlify Blobs store: escape-to-change-results

Teacher
  -> /teacher.html
  -> GET /api/results + Bearer ETC_ADMIN_TOKEN
  -> summary table / detail / CSV

ข้อควรทราบ
-----------
- ต้องมีอินเทอร์เน็ตสำหรับ YouTube
- localStorage ยังใช้สำหรับ Resume เมื่อ refresh
- Cloud submission เป็นชั้นเพิ่มเติม ไม่ได้แทน local resume
- หาก server ชั่วคราวล่ม นักศึกษายัง Export JSON เป็น fallback ได้
Redeploy after environment variable update
