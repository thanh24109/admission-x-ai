from pydantic import BaseModel

class CandidateProfile(BaseModel):
    candidate_id: str
    interested_programs: list[str] = []
    study_preferences: list[str] = []
