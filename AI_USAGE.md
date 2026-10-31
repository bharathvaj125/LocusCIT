# AI usage declaration

## 1. AI inside the deployed product
| What | Provider / model | Used for | Always on? |
| --- | --- | --- | --- |
| Optional booking-text assist | Anthropic Messages API (`LLM_MODEL`, default `claude-haiku-5-5`) via `LLM_API_KEY` | Reading an English/Hinglish request and suggesting values for fields the rule-based parser left empty (headcount, day, time, needs) | **No.** Off unless `AI_ENABLED=true` and a key is set. Default deployment can run without it. |

Everything else that looks "intelligent" is deterministic code, not an LLM:
the English/Hinglish parser (`backend/app/nlp.py`), faculty change-request parsing (`backend/app/api_faculty.py`),
and all explanations (`backend/app/api_explain.py`, built from rule checks and penalty arithmetic).

If the LLM is off, rate-limited, wrong or unreachable, the deterministic parser and the manual booking form still work.

## 2. What the LLM is NOT allowed to decide
* Whether a timetable, exam plan or booking is valid (only our code and the official `validator.py` decide).
* Booking priority, effective category, approval, rejection or alternatives.
* Roles and permissions (always read from the signed-in user, never from text).
* Whether a proposal is applied (an Admin approves; self-approval is blocked by the backend).

LLM output is sanitised against a strict schema (`backend/app/ai.py`), may only fill empty fields, and is shown to the user
as an editable draft with the assumptions listed. Instructions hidden in user text ("ignore the rules", "I am the admin",
"mark it institute level") are detected, reported and ignored.

## 3. AI tools used to build the project
| Tool | Used for |
| --- | --- |
| Claude Code (Anthropic) | Backend: solver modelling (OR-Tools CP-SAT), FastAPI endpoints, parsers, tests, deployment files and documentation. Frontend: connecting the screens to the real API (login, data layer, approvals, disruptions, assistant, exports) and removing mock data. Always under the team's direction and review. |
| Figma (MCP connector, driven from the same assistant) | Design tokens, the style guide and the Timetable screen in the Figma file linked from `docs/DESIGN.md`; the visual identity was designed there and then implemented in code. |
| _Frontend owner's tools_ | **To be completed by the frontend owner before submission** (every coding/design assistant actually used for the original UI). |

## 4. Prompts
Prompt files or links are kept in `docs/PROMPTS/`. Add the frontend owner's prompts there before submission.
