# Student Performance Prediction System

A full-stack student performance prediction system that combines a trained deep-learning model with a college-style academic eligibility layer. The application supports separate student and faculty portals, academic-record management, AI-based PASS/FAIL prediction, and a what-if prediction workflow.

> **Important:** The deep-learning model and the college eligibility rules are separate components. The model learns a PASS/FAIL pattern from the training data; it does **not** directly use the college rules as its learning algorithm. The application can additionally report `NOT ELIGIBLE` when the configured eligibility rules are not satisfied.

## Features

- Student and faculty authentication with JWT
- Faculty registration and student management
- Academic record entry and updates
- Student dashboard
- What-if prediction without modifying official academic records
- Deep-learning PASS/FAIL prediction
- Prediction probability using a tuned threshold of `0.52`
- College-style eligibility checks for attendance, internals, assignments, and SEE
- SQLite database for local development
- React + Vite frontend
- Flask backend with TensorFlow/Keras model serving

## How the System Works

```text
                   STUDENT / FACULTY
                          |
                          v
                  React Frontend
                          |
                          v
                    Flask REST API
                          |
             +------------+-------------+
             |                          |
             v                          v
      Academic Database          ML Prediction Engine
        (SQLite)                     |
             |                       v
             |              Feature Engineering
             |                       |
             |                       v
             |                  StandardScaler
             |                       |
             |                       v
             |                Neural Network
             |                       |
             |                       v
             |                PASS / FAIL + score
             |
             v
      College Eligibility Rules
             |
             v
       Eligibility Status
             |
             +-------------> Final application status
```

### Prediction flow

1. The system receives five raw academic inputs.
2. The backend engineers additional features from those five values.
3. The resulting 17-feature vector is ordered according to `feature_cols.pkl`.
4. `scaler.pkl` standardizes the vector using the same preprocessing used during training.
5. `student_model.keras` produces a sigmoid output between 0 and 1.
6. `threshold.pkl` stores the decision threshold (`0.52`).
7. Probability >= `0.52` is labelled `PASS`; otherwise `FAIL`.
8. The application separately evaluates the configured college eligibility rules.
9. If eligibility is not satisfied, the application can show `NOT ELIGIBLE` even though the model's independent prediction is still returned as `PASS` or `FAIL`.

## Model Inputs

The user-facing model takes **five raw inputs**:

| Input | Meaning | Current API range |
|---|---|---:|
| Attendance | Attendance percentage | 0–100 |
| Internal Total | Combined internal assessment marks | 0–75 |
| Assignment Total | Combined assignment marks | 0–20 |
| Study Hours | Average study hours per day | 0–24 |
| Previous Performance | Previous academic performance score | 0–100 |

### Engineered model features

The backend expands the five raw inputs into **17 features** before inference:

- `Attendance`
- `Internal_Total`
- `Assignment_Total`
- `Study_Hours`
- `Previous_Performance`
- `Internal_Mean`
- `Internal_Std`
- `Internal_Min`
- `Internal_Max`
- `Internal_Range`
- `Assignment_Mean`
- `Assignment_Std`
- `Assignment_Diff`
- `Total_Score`
- `Study_per_Attendance`
- `Internal_per_Study`
- `Prev_x_Attendance`

This feature engineering is implemented in `backend/ml_engine.py` so that inference uses the same structure expected by the saved preprocessing artifacts and model.

## Neural Network Architecture

The saved Keras model is a binary-classification neural network with 17 input features:

```text
17 input features
       |
       v
Dense(128, sigmoid)
       |
Batch Normalization
       |
Dropout(0.35)
       |
Dense(64, sigmoid)
       |
Batch Normalization
       |
Dropout(0.30)
       |
Dense(32, sigmoid)
       |
Dropout(0.20)
       |
Dense(1, sigmoid)
       |
       v
  Model score (0–1)
```

The final sigmoid value is compared with the saved threshold (`0.52`) to produce `PASS` or `FAIL`.

## College-Style Eligibility Layer

The application also contains a rule-based academic eligibility checker. These rules are **not the model's training logic**; they are a separate application layer used to determine whether a student is eligible for the configured Semester End Examination workflow.

### Attendance

- `< 60%` → Not eligible
- `60% to < 75%` → Eligible, fine applicable
- `>= 75%` → Eligible, no fine

### Internal assessment

The current application implementation expects an internal total on a **0–75 scale** and checks:

- `>= 30/75` → Internal requirement passed
- `< 30/75` → Internal requirement failed

The current UI/backend describes this as **3 exams × 25 marks**. This reflects the implementation currently present in the repository.

### Assignments

- Total range: `0–20`
- `>= 12/20` → Assignment requirement passed
- `< 12/20` → Assignment requirement failed

### SEE passing information shown by the application

- Written theory paper: `80` marks
- Converted/scaled: `100` marks
- Minimum passing score shown by the application: `34/100`

> These values are application-specific rules for the project demonstration and should be verified against the institution's current official regulations before being used for real academic decisions.

## Training Data Summary

The trained project dataset used for the reported evaluation contained **500 student records** with five input features and one target label (`Passed`). The recorded class distribution was:

| Class | Records |
|---|---:|
| Passed | 299 |
| Failed | 201 |
| **Total** | **500** |

The project dataset had no missing values in the reviewed columns. The target is binary: `0/Fail` and `1/Pass`.

## Model Evaluation

The project evaluation previously reported for the trained model includes:

- Test Accuracy: **~87%**
- AUC: **0.9722**
- Best threshold: **0.52**
- Best F1 score: **0.871**
- Example test-set classification: Fail precision **0.85**, recall **0.82**, F1 **0.84**; Pass precision **0.89**, recall **0.90**, F1 **0.89**

The repository contains the trained model and inference artifacts, but it does not currently include the original model-training notebook/script or the evaluation dataset. The metrics above therefore document the reported evaluation of the current trained model rather than a result that can be reproduced from this repository alone.

## Project Structure

```text
student-performance-system/
|
+-- README.md
+-- .gitignore
+|
+├── backend/
+│   ├── app.py
+│   ├── database.py
+│   ├── ml_engine.py
+│   ├── requirements.txt
+│   ├── .env.example
+│   └── model/
+│       ├── student_model.keras
+│       ├── feature_cols.pkl
+│       ├── scaler.pkl
+│       └── threshold.pkl
+|
+└── frontend/
+    ├── package.json
+    ├── package-lock.json
+    ├── vite.config.js
+    ├── index.html
+    └── src/
+        ├── App.jsx
+        ├── main.jsx
+        ├── contexts/
+        ├── components/
+        ├── lib/
+        └── pages/
+```

`node_modules/`, `frontend/dist/`, Python cache files, local SQLite databases, and `.env` are intentionally excluded from the public repository.

## Technology Stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Lucide React
- React Hook Form
- React Hot Toast

### Backend

- Python
- Flask
- Flask-CORS
- Flask-JWT-Extended
- SQLite
- TensorFlow / Keras
- NumPy
- scikit-learn
- joblib
- Werkzeug

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd student-performance-system
```

### 2. Backend setup

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `.env` and replace `JWT_SECRET_KEY` with a strong random value.

Start the Flask API:

```powershell
python app.py
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

### 3. Frontend setup

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

The frontend is configured to proxy `/api` requests to the Flask server at `http://localhost:5000`.

## Main Application Flows

### Faculty

```text
Register/Login
     |
     v
Faculty Dashboard
     |
     +--> Add Student
     |
     +--> Manage Students
     |
     +--> Enter / Update Academic Records
     |
     +--> Run Prediction
     |
     +--> View Eligibility + Model Result
```

### Student

```text
Login
  |
  v
Student Dashboard
  |
  +--> View Profile / Academic Data
  |
  +--> View Eligibility
  |
  +--> Run What-If Prediction
```

The what-if prediction endpoint does not modify the student's stored academic record.

## API Overview

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Login for student/faculty |
| `POST /api/auth/register-faculty` | Register faculty |
| `GET /api/student/profile` | Get student profile + records + eligibility |
| `GET /api/student/predict` | Predict from official student records |
| `POST /api/predict` | What-if prediction from manual inputs |
| `GET /api/faculty/students` | List faculty-owned students |
| `POST /api/faculty/students` | Create student |
| `PUT /api/faculty/students/<id>/academic` | Save academic record |
| `GET /api/faculty/predict/<id>` | Predict for a faculty-managed student |
| `GET /api/health` | Backend health check |

## Security Notes

- Never commit `.env` files.
- Never commit real passwords, API keys, database credentials, or private tokens.
- Do not use real Aadhaar or other sensitive personal data in a public demo repository.
- The JWT secret must be changed from the development placeholder before deployment.
- SQLite is suitable for local/demo usage; production deployments should use a properly secured database and secret-management solution.

## Known Limitations

- The training dataset and training notebook/script are not included in this repository.
- The model depends on the saved scaler, feature-column list, threshold, and Keras model files remaining consistent.
- The college eligibility rules are hard-coded application logic and may not match future institutional policy changes.
- Model prediction should be treated as decision support, not as an official academic decision.
- The current feature-engineering code reconstructs summary statistics for internals and assignments from their totals, which may lose information about the distribution of individual assessments.

## Future Improvements

- Add the complete training pipeline and reproducible evaluation notebook.
- Add explainability such as SHAP or feature-attribution views.
- Store model version and prediction timestamp with each inference.
- Replace hard-coded eligibility rules with configurable institutional settings.
- Add PostgreSQL/MongoDB support for production deployment.
- Add automated tests and CI/CD.
- Add model monitoring and drift detection.

## Disclaimer

This project is an educational/portfolio implementation of a student performance prediction workflow. Its predictions and eligibility checks should not be used as the sole basis for real academic decisions.
