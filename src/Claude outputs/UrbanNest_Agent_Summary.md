# UrbanNest-Agent — Project Summary

*Prepared from a direct review of the codebase at
`/Users/jyothishss/Desktop/Jyothish/WebKnots/UrbanNest/UrbanNest-Agent` on 2026-11-11.*

## 1. What this project is

`UrbanNest-Agent` is a **separate, standalone Python project** (not part of the
`urbannest-admin` React frontend or its Django backend). It is an early-stage,
largely-scaffolded attempt to build a **hierarchical multi-agent AI system** for
UrbanNest, a property management company that manages residential and commercial
tenants.

The long-term vision is an org-chart-shaped tree of AI agents — from a top-level
"CEO" agent down to individual task agents — where each layer delegates work to
the layer below it. The only branch with real, working code today is the
**Maintenance → Intake Agent** path: turning a tenant's maintenance call (text or
audio) into a structured maintenance ticket.

This project has **no connection to the UrbanNest web app's codebase or database**
— it's a self-contained proof of concept, currently run only via a local test
script (`main.py`), with no API, no persistence layer, and no UI.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Language | Python 3.14 |
| Agent framework | LangGraph (installed, not yet actually used — no graph is wired up yet) |
| LLM | Claude (`claude-sonnet-4-6`) via the Anthropic API |
| Audio transcription | OpenAI Whisper, running locally (`base` model), free, works offline after first download |
| Audio processing | ffmpeg |
| Config | `python-dotenv`, `pyyaml` |
| Source control | Git, pushed to `github.com/devwebknots/UrbanNest-Agent` |

`requirements.txt` exists but is currently **empty** — dependencies were installed
manually into the `venv/` and never pinned/exported.

## 3. Intended architecture (designed, mostly not built yet)

```
CEO Agent                          (1 instance)
    └── VP Agents                  (multiple)
            └── Director Agents    (multiple)
                    └── Regional Agents (multiple)
                            └── Portfolio Agents (multiple)
                                    └── PM Super Agents (multiple)  ← primary focus
                                            └── Lead Agents per Module
                                                    └── Individual Task Agents
```

Planned modules under each PM Super Agent:
- **Finance** — invoice, budget, payroll agents
- **HR** — hiring, onboarding agents
- **Operations** — scheduling agent
- **Maintenance** — intake, work order agents ← *the one module actually started*

## 4. What is actually built and working today

Only the **Maintenance Intake Agent** has real logic behind it. Everything else in
the folder tree is an empty placeholder file (0 bytes) reserving the name/location
for future work.

### Maintenance Intake Agent — functional, tested, no persistence

**Purpose:** take a tenant's maintenance report (plain text transcript, or an MP3
recording) and turn it into a structured ticket object — no human ticket-writing
required.

**Flow:**
```
Input (text transcript OR audio file)
        ↓
[tools/transcription.py]  — if audio: Whisper converts MP3 → text (runs locally)
        ↓
[tools/summarizer.py]     — Claude API: raw transcript → clean 2–3 sentence summary
        ↓
[tools/extraction.py]     — Claude API: transcript → structured JSON fields
                             (issue, unit, priority, category)
        ↓
[agents/modules/maintenance/intake_agent.py]
        — orchestrates the above, decides should_create_ticket = true/false
        ↓
Output: a MaintenanceState dict (effectively a draft ticket)
```

**State shape** (`agents/modules/maintenance/state.py`):
```python
class MaintenanceState(TypedDict):
    transcript: str
    summary: Optional[str]
    issue: Optional[str]
    unit: Optional[str]
    priority: Optional[str]          # low / medium / high
    category: Optional[str]          # plumbing / electrical / hvac / general
    should_create_ticket: Optional[bool]
    error: Optional[str]
```

**Priority rules** (currently hardcoded into the Claude prompt inside
`tools/extraction.py`, not configurable anywhere yet):
- **HIGH** — no electricity/water/heat/AC, flooding, fire risk, gas leak, sewage,
  security issue, elderly/children affected, or the tenant uses words like
  "urgent" / "emergency" / "dangerous"
- **LOW** — cosmetic issues (paint, carpet, scratches), non-essential appliances,
  tenant says "no rush" / "whenever"
- **MEDIUM** — everything else

**Category rules** (also hardcoded in the same prompt): plumbing / electrical /
hvac / general, inferred from keywords in the transcript.

**Sample tested output** (from `PROGRESS.md`):
```json
{
  "transcript": "Hi, this is Mike from Unit 307...",
  "summary": "Tenant Mike from Unit 307 reported that his air conditioning unit stopped working as of last night...",
  "issue": "Air conditioning unit has stopped working completely",
  "unit": "307",
  "priority": "high",
  "category": "hvac",
  "should_create_ticket": true,
  "error": null
}
```

Tested so far with three scenarios: a fake text transcript (leaking pipe, medium
priority), a real MP3 recording (`tests/audio/test_call.mp3` — AC not working,
high priority), and a low-priority scenario (garden cleanup).

### Supporting pieces confirmed working
- `config/settings.py` — loads `ANTHROPIC_API_KEY` and the model name from `.env`
  (raises if the key is missing)
- `main.py` — a manual test runner; currently hardcoded to run the "Jennifer,
  Unit 512, garden cleanup" transcript and print the resulting JSON
- `.env` holds the Anthropic API key (git-ignored, never committed — confirmed via
  `.gitignore`)

## 5. What exists only as empty stubs (folder reserved, no code yet)

Everything below is a 0-byte placeholder file — the structure was scaffolded
up front, but no logic has been written:

- **Executive tier:** `agents/executive/ceo_agent.py`, `vp_agent.py`, `director_agent.py`
- **Management tier:** `agents/management/regional_agent.py`, `portfolio_agent.py`
- **Project tier:** `agents/project/pm_super_agent.py`
- **Other modules:** all of `agents/modules/finance/*`, `agents/modules/hr/*`,
  `agents/modules/operations/*`
- **Rest of Maintenance module:** `agents/modules/maintenance/lead_agent.py`
  (explicitly called out in `PROGRESS.md` as "next to build"),
  `work_order_agent.py`
- **Graphs:** `graphs/executive_graph.py` (the only one even created, still empty),
  plus `management_graph.py`, `pm_graph.py`, `module_graph.py` (not even created
  as files yet)
- **Shared state definitions:** `state/base_state.py`, `executive_state.py`,
  `pm_state.py`, `module_state.py` (not created yet)
- **Other tools:** `tools/finance_tools.py`, `hr_tools.py`, `ops_tools.py`,
  `escalation_tools.py`
- **Prompts:** `prompts/ceo.md`, `vp.md`, `pm_super.md`, `maintenance_lead.md` (all
  empty — no system prompts written yet for any agent)
- **Memory / persistence:** `memory/checkpointer.py`, `memory/context_store.py`
  (empty — there is currently **no database and no persistence at all**; every
  run of `main.py` starts from nothing and the result is just printed to the
  console)
- **Config:** `config/hierarchy.yaml` (empty — the org hierarchy isn't actually
  encoded anywhere yet)
- **Tests:** `tests/test_pm_agent.py`, `tests/test_graphs.py` (empty — no real
  test suite yet, just the one manual `main.py` script and a sample audio file)

## 6. Key decisions already made (recorded in the project's own PROGRESS.md)

1. **Priority/category rules should eventually be PM-configurable, not
   hardcoded.** Right now they live inside a Claude prompt in `extraction.py`.
   The plan is to move them into a database, make them editable from the PM
   Portal (the real UrbanNest web app), and have the agent fetch them at
   runtime — no developer involvement needed to change a rule.
2. **Audio transcription uses local Whisper, not the Claude API**, because
   Claude's API doesn't accept audio directly. Whisper runs free and offline
   on the Mac after the first ~140MB model download.
3. **In production, call audio would come from a telephony provider** (e.g.
   Twilio or Bland.ai) which would record the call and hand the MP3 to the
   agent automatically — no manual file handling.

## 7. Explicit next steps (per the project's own roadmap)

**Immediate:**
1. Build the **Maintenance Lead Agent** — receive tickets from the Intake
   Agent, assign them to a Work Order Agent, track status
2. Add a **real database** for tickets (SQLite to start, Postgres for
   production) — there is currently zero persistence
3. Build the **PM Portal rules engine** — let a PM configure priority rules,
   categories, and routing without code changes

**Further out:**
4. PM Super Agent — oversees all module lead agents
5. Portfolio Agent — oversees multiple PM Super Agents
6. Build out Regional → Director → VP → CEO agents
7. Twilio integration for real phone calls
8. A dashboard for viewing/managing tickets

## 8. Important context for whoever picks this up

- This is **not wired into the UrbanNest web application** (the `urbannest-admin`
  React/Django app) at all yet — it's a standalone Python prototype with no API
  surface of its own.
- "LangGraph" is installed and named throughout the planned folder structure, but
  **no actual graph has been built** — the current Intake Agent is a plain
  sequential Python function (`run_intake_agent`), not a LangGraph graph.
- There is no error handling beyond a single top-level `try/except` in the intake
  agent that sets `error` and forces `should_create_ticket = False`.
- The only "test suite" today is manually running `main.py` with a hardcoded
  transcript and eyeballing the printed JSON.
- Model in use: `claude-sonnet-4-6`. API key lives in a git-ignored `.env` file —
  never committed to the `devwebketer/UrbanNest-Agent` GitHub repo.

---
*This summary reflects the code as it exists on disk; it is not a design
proposal. The empty stub files describe the intended shape of the system per the
project's own `PROGRESS.md`, not work that has actually been done.*
