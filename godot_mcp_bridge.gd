extends Node
## Godot MCP Bridge
## Add this as an autoload singleton to enable MCP remote features like screenshots
##
## Setup:
## 1. In Godot Editor: Project > Project Settings > Autoload
## 2. Add this script with name "GodotMCPBridge"
## 3. Run your game (F5)
## 4. The MCP server can now send commands via print statements

var command_prefix = "MCP_COMMAND:"
var response_prefix = "MCP_RESPONSE:"

func _ready():
	print(response_prefix + '{"type":"ready","bridge_version":"1.0"}')
	print("Godot MCP Bridge initialized")

func _process(_delta):
	# Check for commands from stdin (if running with --remote-debug)
	# For now, we'll use a simpler approach: respond to marker prints
	pass

## Capture a screenshot and print it as base64-encoded JSON
func capture_screenshot(format: String = "png") -> Dictionary:
	var viewport = get_tree().root.get_viewport()
	if not viewport:
		var error = {"type": "screenshot", "error": "Failed to get viewport"}
		print(response_prefix + JSON.stringify(error))
		return error

	var img = viewport.get_texture().get_image()
	if not img:
		var error = {"type": "screenshot", "error": "Failed to get image from viewport"}
		print(response_prefix + JSON.stringify(error))
		return error

	var buffer = PackedByteArray()
	if format == "jpg" or format == "jpeg":
		buffer = img.save_jpg_to_buffer(0.9)
	else:
		buffer = img.save_png_to_buffer()

	if buffer.is_empty():
		var error = {"type": "screenshot", "error": "Failed to encode image"}
		print(response_prefix + JSON.stringify(error))
		return error

	var base64 = Marshalls.raw_to_base64(buffer)
	var result = {
		"type": "screenshot",
		"success": true,
		"data": base64,
		"size": buffer.size(),
		"width": img.get_width(),
		"height": img.get_height(),
		"format": format
	}

	print(response_prefix + JSON.stringify(result))
	return result

## Call this from anywhere in your game to trigger a screenshot
## Example: GodotMCPBridge.request_screenshot()
func request_screenshot(format: String = "png"):
	capture_screenshot(format)

## Simulate a click at screen coordinates
func simulate_click(x: int, y: int, button: int = MOUSE_BUTTON_LEFT):
	var event = InputEventMouseButton.new()
	event.button_index = button
	event.pressed = true
	event.position = Vector2(x, y)

	Input.parse_input_event(event)

	# Also send release event
	await get_tree().create_timer(0.1).timeout
	event.pressed = false
	Input.parse_input_event(event)

	var result = {
		"type": "click",
		"success": true,
		"x": x,
		"y": y,
		"button": button
	}
	print(response_prefix + JSON.stringify(result))
	return result

## Process commands from MCP
## Commands should be printed with prefix "MCP_COMMAND:" followed by JSON
func _on_command_received(command_str: String):
	var json = JSON.new()
	var error = json.parse(command_str)
	if error != OK:
		print(response_prefix + '{"type":"error","message":"Invalid JSON command"}')
		return

	var command = json.data
	match command.get("action"):
		"screenshot":
			var format = command.get("format", "png")
			capture_screenshot(format)
		"click":
			var x = command.get("x", 0)
			var y = command.get("y", 0)
			var button = command.get("button", MOUSE_BUTTON_LEFT)
			simulate_click(x, y, button)
		_:
			print(response_prefix + '{"type":"error","message":"Unknown command action"}')
