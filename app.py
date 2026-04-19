import streamlit as st

st.title("Travel Risk Calculator")

# Input fields
source = st.text_input("Source")
destination = st.text_input("Destination")

# Button to calculate risk
if st.button("Calculate Risk"):
	# Placeholder for risk calculation logic
	# Replace with actual function call
	risk_score = 0.75  # Example static value
	factors = ["Weather conditions", "Road quality", "Crime rate"]

	st.subheader("Risk Score")
	st.write(f"{risk_score}")

	st.subheader("Factors Affecting Risk")
	for factor in factors:
		st.write(f"- {factor}")