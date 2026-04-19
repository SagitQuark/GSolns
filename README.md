# Travel Risk Calculator

This project provides a simple Streamlit-based UI to calculate travel risk between a source and destination.

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## Setup Instructions

1. **Clone the repository** (if not already done):
   ```sh
   git clone <repo-url>
   cd GSolns
   ```

2. **Install dependencies**:
   ```sh
   pip install -r requirements.txt
   ```
   If `streamlit` is not listed in `requirements.txt`, install it manually:
   ```sh
   pip install streamlit
   ```

3. **Run the Streamlit app**:
   ```sh
   streamlit run app.py
   ```

4. **Open your browser** and go to:
   - [http://localhost:8501](http://localhost:8501)

## Usage
- Enter the Source and Destination in the input fields.
- Click the "Calculate Risk" button to view the risk score and factors.

---

Feel free to modify the risk calculation logic in `app.py` to connect with your backend or models.
