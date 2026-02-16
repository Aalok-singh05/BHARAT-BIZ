
import pytest
from unittest.mock import MagicMock, patch
from app.router.message_router import route_message
from app.services.order_processing_service import process_customer_order
from app.schemas.measurement_schema import TextileMeasurement

# Mock Dependencies
@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_download():
    with patch("app.services.media_service.download_whatsapp_media") as mock:
        yield mock

@pytest.fixture
def mock_image_extract():
    with patch("app.services.image_order_extractor.extract_order_from_image") as mock:
        yield mock

@pytest.fixture
def mock_voice_extract():
    with patch("app.services.voice_order_extractor.extract_order_from_voice") as mock:
        yield mock

@pytest.fixture
def mock_process_order():
    with patch("app.router.message_router.process_customer_order") as mock:
        yield mock

@pytest.fixture
def mock_inventory():
    with patch("app.router.message_router.get_all_inventory_batches") as mock:
        mock.return_value = []
        yield mock

@pytest.fixture
def mock_session_check():
    with patch("app.router.message_router.get_active_session_by_phone") as mock:
        mock.return_value = None  # Always new order
        yield mock


def test_text_message_routing(mock_db, mock_process_order, mock_inventory, mock_session_check):
    """Verify standard text messages still work"""
    phone = "1234567890"
    message = "50m Red Cotton"
    
    mock_process_order.return_value = {"responses": [{"response": {"message": "Order processed"}}]}
    
    response = route_message(phone, message)
    
    assert response == "Order processed"
    mock_process_order.assert_called_once()
    # verify pre_extracted_items is None
    _, kwargs = mock_process_order.call_args
    assert kwargs.get("pre_extracted_items") is None


def test_image_message_routing(mock_db, mock_download, mock_image_extract, mock_process_order, mock_inventory, mock_session_check):
    """Verify image message triggers download and extraction"""
    phone = "1234567890"
    message = "Caption"
    media_info = {"type": "image", "id": "MEDIA_ID", "mime_type": "image/jpeg"}
    
    # Setup mocks
    mock_download.return_value = (b"fake_image_bytes", "image/jpeg")
    mock_items = [TextileMeasurement(material_name="Cotton", input_quantity=10, input_unit="m", normalized_meters=10)]
    mock_image_extract.return_value = mock_items
    mock_process_order.return_value = {"responses": [{"response": {"message": "Order processed"}}]}
    
    response = route_message(phone, message, media_info)
    
    # Checks
    mock_download.assert_called_with("MEDIA_ID")
    mock_image_extract.assert_called_with(b"fake_image_bytes", "image/jpeg", caption="Caption")
    
    # Verify items passed to order processing
    _, kwargs = mock_process_order.call_args
    assert kwargs.get("pre_extracted_items") == mock_items
    
    # Verify echo back
    assert "📷 Image se samjha gaya order:" in response
    assert "Cotton" in response


def test_voice_message_routing(mock_db, mock_download, mock_voice_extract, mock_process_order, mock_inventory, mock_session_check):
    """Verify voice message triggers download and extraction"""
    phone = "1234567890"
    message = "" # Voice notes have no text body
    media_info = {"type": "audio", "id": "AUDIO_ID", "mime_type": "audio/ogg"}
    
    # Setup mocks
    mock_download.return_value = (b"fake_audio_bytes", "audio/ogg")
    mock_items = [TextileMeasurement(material_name="Silk", input_quantity=5, input_unit="m", normalized_meters=5)]
    mock_voice_extract.return_value = mock_items
    mock_process_order.return_value = {"responses": [{"response": {"message": "Order processed"}}]}
    
    response = route_message(phone, message, media_info)
    
    # Checks
    mock_download.assert_called_with("AUDIO_ID")
    mock_voice_extract.assert_called_with(b"fake_audio_bytes", "audio/ogg")
    
    # Verify items passed to order processing
    _, kwargs = mock_process_order.call_args
    assert kwargs.get("pre_extracted_items") == mock_items
    
    # Verify echo back
    assert "🎤 Voice note se samjha gaya order:" in response
    assert "Silk" in response
