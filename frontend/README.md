# DX frontend

## ElevenLabs patient interviews

The evaluation page embeds the ElevenLabs voice widget for one reusable patient
agent. Each conversation receives the patient saved for that simulation; refreshing
or reopening a simulation preserves the same patient. It starts a new voice session,
not a continuation of the previous conversation transcript.

### Website configuration

Set this in `frontend/.env.local` (or your hosting environment) and restart Next.js:

```dotenv
ELEVENLABS_AGENT_ID=agent_6801m3fb3taxf4prh0vvq8yy4g7q
```

This is the agent from the sample HTML. Replace the ID whenever you want to use a
different agent. Keep your existing Auth0 and backend environment variables.
This basic public-agent widget does not require an ElevenLabs API key or voice ID;
the voice is selected in the agent's dashboard.

### ElevenLabs dashboard configuration

1. Open this agent and replace any fixed patient-specific system prompt with
   [the reusable patient prompt](docs/elevenlabs-patient-prompt.txt). Its
   `{{patient_json}}` placeholder receives the generated patient profile.
2. Set **First message** to exactly `{{opening_line}}`.
3. The website supplies both custom dynamic variables on every call:

   | Variable | Value supplied by the website |
   | --- | --- |
   | `patient_json` | JSON string with identity, symptoms, onset, severity, timeline, history, medications, allergies, pertinent negatives, and details to reveal when asked |
   | `opening_line` | The saved patient's natural opening sentence |

   Dashboard placeholder values are for testing. The website sends the actual
   simulation values. Remove any unrelated required variables from a previous
   agent configuration unless the website also supplies them.
4. Use a public agent with authentication disabled for this basic embed. Allow
   your website domain in the agent's Security allowlist, including `localhost`
   while testing locally. Use voice mode and select the desired voice in the
   dashboard. Remove any previous case-specific knowledge or instructions that
   conflict with the variable patient data.
5. Dynamic variables do not need System prompt or First message overrides enabled.

See the official [widget documentation](https://elevenlabs.io/docs/eleven-agents/customization/widget)
and [dynamic variables guide](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables).

### Trying it

Run the Python backend and Next.js with the existing Auth0 settings, sign in, and
start a simulation. Open **Start patient interview** in the floating voice widget,
allow microphone access, and ask about symptoms. End the interview before submitting
your diagnosis. Microphone access requires HTTPS in production; localhost works for
development. The completed review does not mount a voice widget.

The backend verifies account ownership before providing conversation data. The
widget receives patient facts without the diagnosis, source disease ID, or
association ranks. Patient facts passed to a browser widget remain inspectable in
developer tools; this is a practice interview, not a mechanism for hiding exam
answers from the browser. The start route no longer returns or logs the full case.

If the widget is missing, check `ELEVENLABS_AGENT_ID` and restart Next.js. If it loads
but the call fails, check the agent's authentication, domain allowlist, required
dynamic variables, and microphone permissions. Widget connection errors appear in
the widget itself. If patient data is unavailable, check the backend connection.
