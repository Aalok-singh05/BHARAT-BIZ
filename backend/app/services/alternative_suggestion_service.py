from collections import defaultdict


def find_alternatives(session, item):

    measurement = item.measurement
    material = measurement.material_name
    current_color = measurement.color

    alternatives = defaultdict(float)

    for batch in session.available_batches:

        if batch.material_name.lower() != material.lower():
            continue

        if batch.color.lower() == current_color.lower():
            continue

        meters = (
            batch.rolls_available * batch.meters_per_roll
            + batch.loose_meters_available
        )

        if meters > 0:
            alternatives[batch.color] += meters

    return dict(alternatives)


def build_alternative_message(item, alternatives):

    if not alternatives:
        return "Is item ke liye koi alternative available nahi hai."

    material = item.measurement.material_name

    lines = [f"{material} me yeh alternatives available hain:\n"]

    for color, meters in alternatives.items():
        lines.append(f"• {color} — {meters}m available")

    lines.append("\nAap kaunsa chahenge?")

    return "\n".join(lines)
