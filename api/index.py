from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Clinicboard API",
    description="FHIR-native medical API for clinical management",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/api/patients")
async def list_patients():
    """List all patients — FHIR R4 Patient Resource"""
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": 0,
        "entry": [],
    }


@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get a single patient by ID"""
    return {"resourceType": "Patient", "id": patient_id}


@app.get("/api/appointments")
async def list_appointments():
    """List appointments — FHIR R4 Appointment Resource"""
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": 0,
        "entry": [],
    }


@app.get("/api/encounters")
async def list_encounters():
    """List encounters — FHIR R4 Encounter Resource"""
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": 0,
        "entry": [],
    }


@app.get("/api/prescriptions")
async def list_prescriptions():
    """List medication requests — FHIR R4 MedicationRequest Resource"""
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": 0,
        "entry": [],
    }
