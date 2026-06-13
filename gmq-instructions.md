# AI AGENT INSTRUCTION: GMQ RECAP SYSTEM (NEXT.JS 14.2)

You are an expert full-stack developer. Your task is to implement a smart web application for an Indonesian school to automate their daily Quran Reading Movement (GMQ) attendance and penalty report.

## 1. ENVIRONMENT & STACK SPECIFICATION
- **Framework:** Next.js 14.2 (App Router)
- **Folder Structure:** No `src` directory (Files are directly in root folders like `app/`, `components/`, etc.)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Core Libraries to Use:** `exceljs`, `string-similarity`

## 2. DATABASE SCHEMA (PostgreSQL)
Ensure the database integration connects to these two tables in Supabase:

```sql
-- Table 1: Master Data Siswa
CREATE TABLE siswa_master (
    id SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(255) NOT NULL,
    kelas VARCHAR(10) NOT NULL, -- Value: 'X' or 'XI'
    jurusan VARCHAR(50) NOT NULL -- e.g., 'MPLB 1', 'PPLG 1', 'AKL 2', 'RPL 1'
);

-- Table 2: Daily Attendance Records
CREATE TABLE rekap_gmq_harian (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    siswa_id INT REFERENCES siswa_master(id),
    status_mengisi BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tanggal, siswa_id)
);

3. CORE LOGIC REQUIREMENTS
A. Regex Parsing & Class Mapping
When the admin inputs the raw text and clicks "Proses & Rekap", parse the text using these exact rules:

Line Split: Split the input string line-by-line (split('\n')).

Line Filter: Only process lines starting with a number and a dot/space (Regex: /^\d+[.\s]/). Ignore empty lines (like 13. ) and informational headers/footers.

Class Extraction (Case-Insensitive):

Class XI: If the line contains the substring "xi".

Class X: If the line contains the substring "x " (x followed by space) AND does NOT contain the letter "i" right after it.

Attendance Status: Any student successfully extracted from the list is considered Hadir/Mengisi = TRUE, regardless of what surah, progress, or emojis they wrote after their name.
B. Fuzzy Name Matching & Conflict Resolution
To handle human typos in the WhatsApp list (e.g., Student typed "Fitri" but DB Master has "Fitria Lestari"):

Scope the search: Only look for student names inside the detected Class and Major from the WhatsApp line.

Calculate string similarity using the string-similarity library.

Decision Matrix:

Exact Match (100%): Save directly to rekap_gmq_harian.

Close Match (>75%): If there is ONLY ONE candidate name in that specific class/major scope, automatically map and save it to that student.

Ambiguous Match / Conflict: If the input is ambiguous (e.g., input "Fitri X MPLB 1" but DB Master has BOTH "Fitri Ananda" and "Fitria Lestari" in X MPLB 1):

DO NOT save automatically. Return an AMBIGUOUS status to the frontend.

Display a beautiful Tailwind Modal/Pop-up on the frontend showing the conflicting options as clickable buttons.

The admin will manually click the correct student name, and then the system saves the record.

C. Penalty & Excel Generation
Any student in siswa_master whose name is missing from the daily input on a specific date is automatically counted as Absen (Absent).

Penalty Rule: Sanksi Ayat = Total Days Absent in 1 Month * 3.

Provide a button to download the monthly report as a .xlsx file using exceljs:

Sheet 1: Labeled "KELAS X" (Horizontal grid table: Day 1 to Day 31 for Class X students).

Sheet 2: Labeled "KELAS XI" (Horizontal grid table: Day 1 to Day 31 for Class XI students).

Summary Columns: At the right end of each sheet, dynamically calculate Total Hadir, Total Absen, and Sanksi Ayat.