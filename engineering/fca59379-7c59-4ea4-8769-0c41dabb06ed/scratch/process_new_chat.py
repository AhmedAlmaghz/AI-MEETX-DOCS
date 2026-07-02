import json

with open("new_script_0.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Let's inspect the keys and find where the messages are.
# In Remix bootstrap / hydration state, we usually have a path like:
# state.loaderData["routes/share.$shareId.($action)"] or similar.
# Let's write a recursive search to find any conversation message arrays.

def find_conversations(obj, path=""):
    if isinstance(obj, dict):
        if "title" in obj and "serverResponse" in obj:
            print(f"Found conversation container at path: {path}")
            return obj
        for k, v in obj.items():
            res = find_conversations(v, f"{path}.{k}" if path else k)
            if res:
                return res
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            res = find_conversations(item, f"{path}[{i}]")
            if res:
                return res
    return None

conv = find_conversations(data)
if conv:
    print("Found conversation container!")
    # Let's print keys inside conversation container
    print(conv.keys())
    
    # Check serverResponse
    sr = conv.get("serverResponse", {})
    print("serverResponse keys:", sr.keys())
    
    data_node = sr.get("data", {})
    print("data keys:", data_node.keys())
    
    messages = data_node.get("mapping", {})
    print(f"Found {len(messages)} message nodes in mapping.")
    
    # Let's print the actual conversation flow in order
    # Each node in mapping has a parent and children. Let's trace from the root node (node without parent, or start node).
    # Or just print all messages with text content sorted or structured.
    
    # Let's trace the tree
    nodes = data_node.get("mapping", {})
    root_node_id = None
    for nid, node in nodes.items():
        if not node.get("parent"):
            root_node_id = nid
            print(f"Root node identified: {nid}")
            break
            
    if not root_node_id:
        # Fallback: find any node with parent null
        for nid, node in nodes.items():
            if node.get("parent") is None:
                root_node_id = nid
                break
                
    # Traverse tree
    curr = root_node_id
    path_nodes = []
    visited = set()
    while curr and curr not in visited:
        visited.add(curr)
        node = nodes[curr]
        path_nodes.append(node)
        children = node.get("children", [])
        if children:
            # For shares, there is usually one main path
            curr = children[0]
        else:
            curr = None
            
    print(f"Path has {len(path_nodes)} nodes.")
    
    # Save the readable conversation transcript
    with open("new_chat_transcript.md", "w", encoding="utf-8") as out:
        out.write("# Conversation Transcript\n\n")
        for node in path_nodes:
            msg = node.get("message")
            if not msg:
                continue
            author = msg.get("author", {}).get("role", "system")
            content = msg.get("content", {})
            parts = content.get("parts", [])
            text = ""
            for part in parts:
                if isinstance(part, str):
                    text += part
                elif isinstance(part, dict) and "text" in part:
                    text += part["text"]
            
            if text.strip():
                out.write(f"## Role: {author.upper()}\n\n")
                out.write(text.strip())
                out.write("\n\n---\n\n")
                
    print("Saved new_chat_transcript.md")
else:
    print("Conversation container not found. Let's do a wider search for 'parts'.")
    # Let's do a wider search for parts
    def find_all_parts(obj, results=[]):
        if isinstance(obj, dict):
            if "parts" in obj and isinstance(obj["parts"], list):
                results.append(obj)
            for v in obj.values():
                find_all_parts(v, results)
        elif isinstance(obj, list):
            for v in obj:
                find_all_parts(v, results)
        return results
    
    parts_list = find_all_parts(data)
    print(f"Found {len(parts_list)} nodes containing 'parts'.")
    for i, p in enumerate(parts_list[:10]):
        print(f"Part {i}: {p}")
