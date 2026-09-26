# Illness and symptom repository

Ready-to-use SQLite database: `data/illnesses.sqlite3`. All backend code is Python.
SQLite is built into Python, runs locally and needs no database server.

## Use from Python or Flask

```python
from illness_repository import IllnessRepository

repo = IllnessRepository()
matches = repo.list_diseases(search="pneumonia")
disease = repo.get_disease(matches[0]["id"])
print(disease["name"])
for symptom in disease["symptoms"]:
    print(symptom["rank"], symptom["name"])
```

Both methods return JSON-ready dictionaries/lists, suitable for Flask's `jsonify`.
`get_disease` returns `None` when the ID does not exist. Search matches disease
names, alternate terms and UMLS codes, ignoring case. Empty search lists all diseases.
Each call opens and closes its own read-only connection, so a repository instance
can be shared by Flask requests. The default database path is relative to the
Python module, independent of your working directory. Pass a custom path to
`IllnessRepository(database=...)` if needed.

```sh
python illness_repository.py --search pneumonia
python illness_repository.py --id 1
```

## Source and rank meaning

Source repository: https://github.com/anujdutt9/Disease-Prediction-from-Symptoms

Following its README's **Source-2** path, the repository was cloned into `upstream/`,
including its Jupyter notebook and `notebook/dataset/raw_data.xlsx`. The Excel
file is imported directly. Training classifiers or running the notebook isn't
needed to extract the repository and can lose the original ranking.

Original knowledge database:
https://impact.dbmi.columbia.edu/~friedma/Projects/DiseaseSymptomKB/index.html

Rank 1 is the strongest association, followed by rank 2, etc., preserving Excel
row order. These ranks are **association strength, not symptom probabilities**.
The source describes automated extraction from hospital discharge summaries
from 2004. Occurrence counts count summaries mentioning the disease; they are
not symptom counts or probabilities. Source entries can include signs, tests and
other clinical observations in addition to symptoms a patient can describe.

Caret-separated terms are kept together as one source entry, with all alternate
names and UMLS codes available in `terms`. Original spelling is retained.
Excel row 311 has `UMLS:C0032739_` with no name: its display name is the code,
and its original empty name is preserved in `terms`. No name was inferred.

## Rebuild

The generated database already works without installing packages. Rebuilding
requires Python 3.10+ and `openpyxl`:

```sh
git clone --depth 1 https://github.com/anujdutt9/Disease-Prediction-from-Symptoms.git upstream
python -m pip install -r requirements.txt
python build_database.py
python -m unittest -v
```

Skip cloning when `upstream/` already exists. Rebuilds replace the generated
database after successful import; keep your own application data in a separate
database. Custom input/output paths:

```sh
python build_database.py --source path/to/raw_data.xlsx --database data/custom.sqlite3
```

Tables: `diseases`, `symptoms`, `disease_symptoms` (ordered ranks and Excel row
numbers), `disease_terms`, `symptom_terms`, and `metadata` (source URLs, Git commit,
Excel SHA-256 and rank definition). Foreign keys and indexes support joins.
The importer carries disease names/counts down blank Excel cells and preserves
every populated symptom row. Tests compare every disease, alias, symptom and
rank against the Excel source, verify database integrity, search and rebuilding.

The source clone and notebook remain in `upstream/` locally; that folder is
excluded from Git. The ready-made database is not excluded, so it can be shipped
with your Flask project. Patient simulation is the next project step.
