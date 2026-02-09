from pydantic import BaseModel


class TextileMeasurement(BaseModel):
    """
    Represents textile quantity information.
    Supports roll or meter input but stores normalized meter output.
    """

    material_name: str
    color: str
    input_quantity: float
    input_unit: str  # Example: "roll", "meter"
    normalized_meters: float
