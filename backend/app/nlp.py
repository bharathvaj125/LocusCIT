"""Deterministic English/Hinglish booking-request parser.

Turns free text into an *editable draft*. It never decides validity, priority or approval: those come from
the rule engine and the authenticated role. Instructions hidden in the text ("ignore the rules", "I am the
admin", "mark it institute level") are detected, reported and ignored.
"""
import re
from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))
WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
DAY_WORDS = {
    "MON": ["monday", "mon", "somvar", "somwar", "somvaar"],
    "TUE": ["tuesday", "tues", "tue", "mangalvar", "mangalwar", "mangalvaar"],
    "WED": ["wednesday", "wed", "budhvar", "budhwar", "budhvaar"],
    "THU": ["thursday", "thurs", "thur", "thu", "guruvar", "guruwar", "brihaspativar", "veervar"],
    "FRI": ["friday", "fri", "shukravar", "shukrawar", "shukravaar"],
    "SAT": ["saturday", "sat", "shanivar", "shaniwar"],
    "SUN": ["sunday", "sun", "ravivar", "raviwar"],
}
DAY_RE = {d: re.compile(r"\b(?:" + "|".join(ws) + r")\b") for d, ws in DAY_WORDS.items()}

PEOPLE = (r"(?:people|persons?|pax|log|logon|students?|participants?|dancers?|spectators?|audience|attendees?|"
          r"visitors?|members?|guests?|ppl|seats|singers?|players?|teams?)")
VAGUE_WINDOWS = [  # (regex, from_period, to_period, label, default duration)
    (r"after lunch|post lunch|lunch ke baad", 6, 9, "after lunch (P6-P9)"),
    (r"afternoon|dopahar|dopeher", 6, 9, "afternoon (P6-P9)"),
    (r"evening|shaam|sham|sandhya", 10, 13, "evening (P10-P13)"),
    (r"night|raat", 11, 13, "night (P11-P13)"),
    (r"morning|subah|subha", 1, 5, "morning (P1-P5)"),
]
NEEDS = [
    (r"projector|big screen|screen|slides|presentation", "projector"),
    (r"\bmic(?:s|rophone)?\b|sound|\bpa\b|pa system|speakers?|audio|loudspeaker", "pa_system"),
    (r"\bstage\b|podium", "stage"),
    (r"computers?|\bpcs?\b|coding|hackathon|programming", "computers"),
    (r"power points?|power benches|power sockets?|sockets?|plug points?", "power_benches"),
    (r"wheelchair|accessible|accessibility|disabled|handicap|ramp", "accessible"),
    (r"\bac\b|a/c|air.?condition", "ac"),
]
ABUSE = [
    r"ignore (all |the |any |previous |your )*(rules?|instructions?|priority|priorities|checks?|validation|constraints?)",
    r"(bypass|override|skip|disable|turn off) (all |the |any )*(rules?|priority|checks?|validation|approval|constraints?)",
    r"i am (the |an? )?(admin|administrator|dean|principal|director|hod|registrar|organiser|organizer)",
    r"(mark|set|treat|make|consider) (it |this |as |my request )*(as )?(an? )?(institute|admin|top|highest|urgent|vip)",
    r"(auto[- ]?approve|approve (it|this|my)|force approve|no approval)",
    r"(give|get) (it |this |me )?(top |highest |first )?priority",
    r"system prompt|you are now|act as|disregard|jailbreak|developer mode",
    r"(change|grant|upgrade) (my )?role",
]


def _now(now):
    return (now or datetime.now(IST)).astimezone(IST)


def _period_of_hour(h):
    """Period index that starts at clock hour h (None for lunch hour 13)."""
    if h < 8:
        return None
    if h <= 12:
        return h - 7
    if h == 13:
        return None
    return h - 8


def _hour_to_24(h, marker, context_pm):
    if marker == "pm":
        return h if h == 12 else h + 12
    if marker == "am":
        return 0 if h == 12 else h
    if context_pm:
        return h if h == 12 else (h + 12 if h < 12 else h)
    if 1 <= h <= 7:
        return h + 12
    return h


def _rooms_regex(data):
    ids = sorted((r["id"] for r in data["rooms"]), key=len, reverse=True)
    return re.compile(r"(?<![a-z0-9])(" + "|".join(re.escape(i.lower()) for i in ids) + r")(?![a-z0-9])")


_COUNT_WORDS = r"(?:people|persons?|log|students?|members?|pax|guests?|seats?|attendees|participants|ghante|hours?|hrs?|pm|am|baje)"


def _unknown_rooms(t, data):
    """Room-looking names in the text that are not rooms at this campus (XYZ-9, CR-999, 'hall 77')."""
    known = {r["id"].lower() for r in data["rooms"]}
    numbers = {r["id"].lower().split("-")[-1] for r in data["rooms"] if "-" in r["id"]}
    found = []
    for m in re.finditer(r"\b([a-z]{1,6}-\d{1,4}|[a-z]{1,6}-[a-z]{1,4})\b", t):
        tok = m.group(1)
        if tok not in known and not re.match(r"(?:to|re|e|co|non|pre|post)-", tok) and tok not in found:
            found.append(tok)
    for m in re.finditer(r"\b(?:room|hall|lab|classroom|lh|cr|sh|lhc)\s*(?:no\.?|number|#)?\s*(\d{1,4})\b(?!\s*" + _COUNT_WORDS + r")", t):
        if m.group(1) not in numbers and m.group(0).strip() not in found:
            found.append(m.group(0).strip())
        elif m.group(1) in numbers:
            ids = [r["id"] for r in data["rooms"] if r["id"].lower().endswith("-" + m.group(1))]
            found.append(("vague", m.group(0).strip(), ids))
    return found


def _find_days(t, today):
    found, notes, weekend = [], [], []
    for d, rx in DAY_RE.items():
        if rx.search(t):
            found.append(d)
    rel = None
    if re.search(r"\b(kal|tomorrow|tmrw|tmw)\b", t):
        rel, delta, word = "tomorrow", 1, "kal/tomorrow"
    elif re.search(r"\bparso\b|day after tomorrow", t):
        rel, delta, word = "day after tomorrow", 2, "parso"
    elif re.search(r"\b(aaj|today)\b", t):
        rel, delta, word = "today", 0, "aaj/today"
    rolled = False
    if rel:
        dt = today + timedelta(days=delta)
        note = f"'{word}' means {rel}: {dt.strftime('%A %d %b %Y')} (Asia/Kolkata)"
        if dt.weekday() >= 5:
            # events run Monday to Friday: propose the next weekday and say so, rather than refusing
            dt = dt + timedelta(days=7 - dt.weekday())
            note += f". That is a weekend, so I proposed the next weekday, {dt.strftime('%A %d %b')}; change it if needed"
            rolled = True
        notes.append(note)
        found.append(WEEKDAYS[dt.weekday()])
    if re.search(r"\b(daily|every ?day|all (of )?(the )?(fest )?week|whole week|each day|roz|rozana|weekdays?)\b", t):
        found = ["MON", "TUE", "WED", "THU", "FRI"]
        mode = "all"
    else:
        found = [d for d in WEEKDAYS if d in found]
        mode = "any" if re.search(r"\b(or|any of|either|ya)\b|/", t) and len(found) > 1 else "all"
        if re.search(r"\b(both|and|every|each)\b", t) and len(found) > 1 and not re.search(r"\bany of\b|\bor\b", t):
            mode = "all"
    for d in found:
        if d in ("SAT", "SUN"):
            weekend.append(d)
    if rolled:
        notes.append("ROLLED_TO_WEEKDAY")
    return [d for d in found if d not in ("SAT", "SUN")], mode, notes, weekend


def _times(t):
    """Return (start24, end24, source) from explicit clock times, else None."""
    ctx_pm = bool(re.search(r"evening|shaam|sham|night|raat|afternoon|dopahar|after lunch|pm\b|baje.*(shaam|raat)", t))
    # range: "6 to 8 pm", "11 am to 1 pm", "between 2 and 6 pm", "10 pm to midnight", "8am-6pm"
    rg = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|till|until|-|–|—|and|se)\s*"
                   r"(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(midnight))", t)
    if rg:
        sh, sm, sk, eh, em, ek, mid = rg.groups()
        sh = int(sh)
        if mid:
            e24 = 24
            s24 = _hour_to_24(sh, sk or "pm", True)
        else:
            eh = int(eh)
            e_marker = ek
            s_marker = sk or (ek if ek else None)
            if sk is None and ek in ("am", "pm"):
                s24_pm = _hour_to_24(sh, "pm", True)
                e24tmp = _hour_to_24(eh, ek, True)
                s24 = s24_pm if s24_pm < e24tmp else _hour_to_24(sh, "am", False)
                e24 = e24tmp
            else:
                s24 = _hour_to_24(sh, s_marker, ctx_pm)
                e24 = _hour_to_24(eh, e_marker, ctx_pm or s24 >= 12)
            if e24 <= s24 and e24 + 12 > s24:
                e24 += 12
        if 0 < s24 <= 24 and s24 < e24 <= 26:
            return s24, e24, "range"
    one = re.search(r"(?:at|around|by|from|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|bje)\b", t)
    if one:
        h = int(one.group(1))
        mk = one.group(3) if one.group(3) in ("am", "pm") else None
        return _hour_to_24(h, mk, ctx_pm), None, "single"
    return None


def parse_booking_text(text, data, now=None, role=None):
    raw = (text or "").strip()
    t = " " + re.sub(r"\s+", " ", raw.lower().replace("’", "'")) + " "
    today = _now(now)
    draft = {"raw_text": raw[:1000], "title": None, "attendance": None, "duration_periods": None,
             "windows": [], "day_mode": "all", "needs": [], "room_types": [], "requested_room": None,
             "mandatory_for_groups": [], "requested_category": "club_event", "follow_up": None,
             "follow_ups": [], "assumptions": [], "warnings": [], "ambiguous_fields": [],
             "security_flags": [], "suggestions": [], "interpretation": []}
    if not raw:
        draft["follow_up"] = "Describe the event: what, when, how many people and any needs."
        draft["follow_ups"] = [draft["follow_up"]]
        return draft
    asks = draft["follow_ups"]

    for rx in ABUSE:
        if re.search(rx, t):
            draft["security_flags"].append(re.search(rx, t).group(0).strip())
    if draft["security_flags"]:
        draft["warnings"].append("Priority, roles and approval cannot be changed from the request text; "
                                 "your role and the booking rules decide. Those instructions were ignored.")
        t = re.sub("|".join(ABUSE), " ", t)

    # attendance
    m = (re.search(r"(\d{1,4})\s*\+?\s*" + PEOPLE + r"\b", t)
         or re.search(r"(?:audience|attendance|expecting|around|about|approx(?:imately)?|maybe|nearly|roughly)\s*"
                      r"(?:of\s*)?(\d{2,4})\b(?!\s*(?:am|pm|:|baje))", t))
    if m:
        draft["attendance"] = int(m.group(1))
        t = t.replace(m.group(0), " <ATT> ", 1)

    # duration
    dm = re.search(r"(\d+(?:\.\d+)?)\s*(?:straight\s+|continuous\s+|consecutive\s+)?-?\s*(?:hours?|hrs?|hr|ghante|ghanta|ghantey)\b", t)
    dur_text = None
    if dm:
        dur_text = float(dm.group(1))
        t = t.replace(dm.group(0), " <DUR> ", 1)
    elif re.search(r"\ball day\b|\bfull day\b|\bpura din\b", t):
        dur_text = 9.0
    elif re.search(r"\bhalf an hour\b|\b30 ?min", t):
        dur_text = 1.0

    # room named / room type
    rx_rooms = _rooms_regex(data)
    rm = rx_rooms.search(t.replace("main auditorium", "aud"))
    rooms_by = {r["id"].lower(): r for r in data["rooms"]}
    if rm:
        room = rooms_by[rm.group(1)]
        draft["requested_room"] = room["id"]
    unknown_rooms = [] if rm else _unknown_rooms(t, data)
    types = []
    for rx, ty in [(r"seminar hall|seminar room|\bsh\b", "seminar_hall"), (r"auditorium|\baud\b", "auditorium"),
                   (r"lecture hall|\blh\b", "lecture_hall"), (r"class ?room|\bcr\b", "classroom"),
                   (r"\boat\b|open.?air|outdoor|amphi", "outdoor"),
                   (r"elec(?:tronics?|trical)? lab", "lab_elec"), (r"phys(?:ics)? lab", "lab_phy"),
                   (r"civil lab|\bcivil\b", "lab_civil"), (r"workshop|mech(?:anical)? lab", "workshop")]:
        if re.search(rx, t) and ty not in types:
            types.append(ty)
    if re.search(r"\blab\b|laboratory", t) and not any(x.startswith("lab_") or x == "workshop" for x in types):
        if re.search(r"computers?|\bpcs?\b|coding|hackathon|programming", t):
            types.append("lab_cs")
        else:
            draft["ambiguous_fields"].append("room_types")
            types.append("lab_cs")
            draft["assumptions"].append("'lab' with no subject: assumed a computer lab. Change it if needed.")
    if re.search(r"\bhall\b", t) and not types:
        types += ["seminar_hall", "lecture_hall"]
    if not types and draft["requested_room"]:
        types = [rooms_by[draft["requested_room"].lower()]["type"]]
    explicit_types = bool(types)
    if not types:
        types = ["classroom", "lecture_hall", "seminar_hall"]
        if (draft["attendance"] or 0) > 150:
            types += ["auditorium", "outdoor"]
    draft["room_types"] = types

    needs = []
    for rx, n in NEEDS:
        if re.search(rx, t) and n not in needs:
            needs.append(n)
    if "computers" in needs and not any(x == "lab_cs" for x in draft["room_types"]) and \
            (re.search(r"\blab\b", t) or not explicit_types):
        draft["room_types"] = ["lab_cs"]
    draft["needs"] = needs

    # mandatory groups
    gids = {g["id"] for g in data["student_groups"]}
    comp = bool(re.search(r"compulsory|mandatory|must attend|attendance (is )?required|zaruri", t))
    groups = [g.upper() for g in re.findall(r"\b([a-z]{2,4}-\d)\b", t) if g.upper() in gids]
    dept = {"mechanical": "ME", "civil": "CE", "electrical": "EE", "electronics": "ECE", "ece": "ECE", "cse": "CSE",
            "computer science": "CSE", "mech": "ME", "eee": "EE"}
    year = {"first": 1, "1st": 1, "second": 2, "2nd": 2, "third": 3, "3rd": 3, "final": 3, "fourth": 4}
    for dw, code in dept.items():
        ym = re.search(dw + r"\s+(?:students?\s+)?(first|1st|second|2nd|third|3rd|final)\s+years?", t)
        if ym and f"{code}-{year[ym.group(1)]}" in gids:
            groups.append(f"{code}-{year[ym.group(1)]}")
    draft["mandatory_for_groups"] = sorted(set(groups))
    if comp and not groups:
        asks.append("It is compulsory for someone, but which student group (for example CSE-3)?")
        draft["ambiguous_fields"].append("mandatory_for_groups")
    if groups and draft["attendance"] is None:
        size = sum(g["size"] for g in data["student_groups"] if g["id"] in groups)
        draft["attendance"] = size
        draft["assumptions"].append(f"No headcount given; used the size of {', '.join(sorted(set(groups)))} ({size}).")
        draft["ambiguous_fields"].append("attendance")

    # category wish (the server still caps it by role)
    if re.search(r"guest lecture|invited talk|industry speaker|speaker|alumni talk", t):
        draft["requested_category"] = "guest_lecture"
    if re.search(r"department|dept|\bece\b|\bcse\b|farewell|alumni|pre-?placement", t):
        draft["requested_category"] = "department_event" if draft["requested_category"] != "guest_lecture" else "guest_lecture"
    if re.search(r"inauguration|closing ceremony|convocation|institute|official spectra", t):
        draft["requested_category"] = "institute_event"
    if role:
        draft["interpretation"].append(
            f"Requested category is a wish only; as a '{role}' your bookings are capped by your role.")

    # days
    days, mode, dnotes, weekend = _find_days(t, today)
    if "ROLLED_TO_WEEKDAY" in dnotes:
        dnotes = [n for n in dnotes if n != "ROLLED_TO_WEEKDAY"]
        draft["ambiguous_fields"].append("windows")
    draft["interpretation"] += dnotes
    draft["day_mode"] = mode
    if weekend:
        asks.append(f"Events are scheduled Monday to Friday; {', '.join(weekend)} is not available. Which weekday?")
    # time
    tm = _times(t)
    win = None
    if tm:
        s24, e24, kind = tm
        p0 = _period_of_hour(s24)
        if e24:
            p1 = _period_of_hour(e24 - 1)
            if e24 - 1 == 12:  # ends exactly at lunch start (13:00)
                p1 = 5
            if p0 is None or p1 is None:
                asks.append("That time falls in the lunch hour or before 08:00; what start time do you want?")
            else:
                win = (p0, p1)
        elif p0 is not None and dur_text:
            win = (p0, p0 + max(1, int(-(-dur_text // 1))) - 1)
        elif p0 is not None:
            win = (p0, p0)
            draft["ambiguous_fields"].append("duration_periods")
        else:
            asks.append("That start time is in the lunch hour or before 08:00; what start time do you want?")
        if s24 and not re.search(r"\b(am|pm)\b", t) and kind in ("range", "single"):
            draft["assumptions"].append(f"No am/pm given; read the start as {s24:02d}:00.")
            draft["ambiguous_fields"].append("windows")
        if win and win[1] > 13:
            asks.append("Events must end by 22:00 (P13); please choose an earlier time.")
            draft["warnings"].append("The requested time runs past 22:00, the last event period.")
            draft["ambiguous_fields"].append("windows")
    else:
        for rx, a, b, label in VAGUE_WINDOWS:
            if re.search(rx, t):
                win = (a, b)
                draft["assumptions"].append(f"Vague time: proposed {label}. Edit the window if you meant something else.")
                draft["ambiguous_fields"].append("windows")
                break

    if not days:
        if not weekend:   # the weekend question already asks for a day
            asks.append("Which day (Monday to Friday) should it be on?")
        draft["ambiguous_fields"].append("windows")
    if win is None and not tm:
        asks.append("What time should it start (or roughly when: morning, afternoon, evening)?")
        draft["ambiguous_fields"].append("windows")
    if win:
        for d in (days or []):
            draft["windows"].append({"day": d, "from_period": win[0], "to_period": win[1]})
    if days and not win:
        draft["windows"] = []

    # duration in periods
    if dur_text is not None:
        draft["duration_periods"] = max(1, int(-(-dur_text // 1)))
    elif tm and tm[1] and win:
        draft["duration_periods"] = max(1, win[1] - win[0] + 1)
    elif win:
        draft["duration_periods"] = 1 if tm else 2
        draft["assumptions"].append(f"No duration given; assumed {draft['duration_periods']} hour(s). Edit if needed.")
        if "duration_periods" not in draft["ambiguous_fields"]:
            draft["ambiguous_fields"].append("duration_periods")
    if draft["duration_periods"] and win and (win[1] - win[0] + 1) < draft["duration_periods"]:
        draft["warnings"].append("The time window is shorter than the event duration.")
        draft["ambiguous_fields"].append("windows")

    if draft["attendance"] is None:
        asks.append("How many people are expected?")
        draft["ambiguous_fields"].append("attendance")

    # a room named in the text that does not exist: say so plainly, never silently pick "any room"
    for v in [u for u in unknown_rooms if isinstance(u, tuple)]:
        draft["warnings"].append(f"'{v[1].upper()}' is not an exact room name. Did you mean {', '.join(v[2])}? "
                                 "Choose the room below, or leave it open.")
        draft["suggestions"] = list(dict.fromkeys(draft["suggestions"] + v[2]))
        draft["ambiguous_fields"].append("requested_room")
    unknown_rooms = [u for u in unknown_rooms if not isinstance(u, tuple)]
    if unknown_rooms:
        import difflib
        pool = [r["id"] for r in data["rooms"] if "event" in r["allowed_uses"]]
        close = []
        for tok in unknown_rooms:
            close += difflib.get_close_matches(tok.upper(), pool, n=3, cutoff=0.5)
        if not close:
            want = draft["attendance"] or 0
            fit = [r for r in data["rooms"] if "event" in r["allowed_uses"] and r["capacity"] >= want
                   and (not draft["room_types"] or r["type"] in draft["room_types"])]
            close = [r["id"] for r in sorted(fit, key=lambda r: r["capacity"])[:3]]
        close = list(dict.fromkeys(close))[:4]
        names = ", ".join(f"'{u.upper()}'" for u in unknown_rooms)
        one = len(unknown_rooms) == 1
        draft["warnings"].append(
            f"{names} {'is' if one else 'are'} not a room at CIT, so {'it was' if one else 'they were'} not used. "
            "Pick a real room" + (f", for example {', '.join(close)}," if close else "")
            + " or leave the room open and one will be proposed.")
        draft["suggestions"] = close
        draft["ambiguous_fields"].append("requested_room")

    # room wish vs needs
    rid = draft["requested_room"]
    if rid:
        room = next(r for r in data["rooms"] if r["id"] == rid)
        feats = set(room["features"]) | ({"accessible"} if room["accessible"] else set())
        problems = []
        miss = set(draft["needs"]) - feats
        if miss:
            problems.append(f"{rid} does not have {sorted(miss)}")
        if draft["attendance"] and room["capacity"] < draft["attendance"]:
            problems.append(f"{rid} seats {room['capacity']}, fewer than {draft['attendance']}")
        if "event" not in room["allowed_uses"]:
            problems.append(f"{rid} cannot host events")
        if problems:
            alts = [r["id"] for r in data["rooms"] if "event" in r["allowed_uses"] and r["id"] != rid
                    and r["type"] == room["type"] and not set(draft["needs"]) - (
                        set(r["features"]) | ({"accessible"} if r["accessible"] else set()))
                    and (not draft["attendance"] or r["capacity"] >= draft["attendance"])]
            draft["warnings"].append("; ".join(problems) + (f". Suggested instead: {', '.join(alts)}." if alts else "."))
            draft["suggestions"] = alts
            draft["ambiguous_fields"].append("requested_room")

    title = re.sub(r"\s+", " ", raw)[:70]
    draft["title"] = title
    draft["ambiguous_fields"] = sorted(set(draft["ambiguous_fields"]))
    draft["follow_up"] = asks[0] if asks else None
    return draft
