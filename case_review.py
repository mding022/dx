"""Build a dataset-grounded debrief from the symptoms selected for a case."""


def build_case_review(case, actual_disease, selected_disease):
    """Compare selected case symptoms by source symptom ID, never by loose text."""
    actual_by_rank = {
        symptom["rank"]: symptom
        for symptom in (actual_disease or {}).get("symptoms", [])
    }
    selected_ids = {
        symptom["id"]
        for symptom in (selected_disease or {}).get("symptoms", [])
    }
    shared = []
    not_linked = []
    patient = case["patient"]

    for symptom in patient.get("symptoms", []):
        source = actual_by_rank.get(symptom.get("association_rank"))
        evidence = {
            "name": symptom.get("name", ""),
            "patient_description": symptom.get("patient_description", ""),
            "onset": symptom.get("onset", ""),
            "severity": symptom.get("severity", ""),
            "association_rank": symptom.get("association_rank"),
        }
        if source and source["id"] in selected_ids:
            shared.append(evidence)
        else:
            not_linked.append(evidence)

    return {
        "shared_symptoms": shared,
        "not_linked_to_selected_diagnosis": not_linked,
        "symptom_timeline": patient.get("symptom_timeline", ""),
        "details_to_reveal_if_asked": patient.get("details_to_reveal_if_asked", []),
        "pertinent_negatives": patient.get("pertinent_negatives", []),
    }
