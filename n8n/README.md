# TenderOS_V4_Demo (OpenAI) for n8n

This folder contains a runnable n8n workflow for a **single-tender-per-run, single-execution** pipeline:

1. `TenderOS_V4_Orchestrator` (all stages in one workflow execution)
2. Optional standalone agent workflows (kept for reuse):
   - `Agent_Ingestion_Index`
   - `Agent_Requirements_Wording`
   - `Agent_BidManager_Packager`
   - `Agent_RFI_Generator`
   - `Agent_QS_ScopeExtract`
   - `Agent_TradeRouter`

## What was fixed

This implementation addresses the most common n8n bugs in AI workflow templates:

- Uses **OpenAI Responses API** (`POST /v1/responses`) instead of Chat Completions.
- Sets `store: false` on every OpenAI call.
- Uses strict JSON output mode (`text.format.type = json_schema`) for each agent call.
- Enforces evidence requirements (`file`, `page`, `snippet`) and `UNKNOWN` fallback paths.
- Uses a single tender folder as system-of-record.
- Writes state-by-state `run_log.json` entries.
- Stops orchestration and sends an error email on sub-workflow failure.

## Prerequisites

- n8n (self-hosted)
- File-system access to `JDRIVE` from n8n runtime
- SMTP credentials configured in n8n for email
- OpenAI API key configured in n8n credentials or env var

## Required environment variables

Set in your n8n deployment:

- `INTAKE_FOLDER=\\JDRIVE\Tenders\_INBOX`
- `TENDERS_ROOT=\\JDRIVE\Tenders`
- `TEMPLATE_TENDER_CONTROL=\\JDRIVE\Tenders\_Templates\Tender_Control_Template.xlsx`
- `TEMPLATE_RFI=\\JDRIVE\Tenders\_Templates\Lean_Tender_RFI_Register.xlsx`
- `OPENAI_MODEL_MAIN=gpt-4.1`
- `OPENAI_MODEL_FAST=gpt-4.1-mini`
- `SPONSOR_EMAIL=...`
- `BIDMANAGER_EMAIL=...`

## Import order

Import `TenderOS_V4_Orchestrator.json` and activate it.

Standalone agent workflows are optional and no longer required for the primary runtime path.

## Notes

- ZIP extraction is handled in the orchestrator with a command step.
- Parsed text extraction uses a lightweight Python helper in `scripts/parse_docs.py`.
- If any required evidence is missing, downstream agents convert findings to `UNKNOWN` + RFI candidates.
