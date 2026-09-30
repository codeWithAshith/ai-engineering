# 03 — Text splitters
#
# CharacterTextSplitter cuts on one separator. A long paragraph stays one chunk.
# RecursiveCharacterTextSplitter tries a blank line, then a line, then a space.
# The index file uses that one: chunk_size 160, overlap 40.
# TokenTextSplitter counts tokens. A cut can land inside a word.
# MarkdownHeaderTextSplitter keeps a heading with its section. These files are plain .txt.

from pathlib import Path

from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter

text = (Path(__file__).parent / "data" / "refund_policy.txt").read_text(encoding="utf-8")

print("character  separator=blank line  size=120")
for i, chunk in enumerate(CharacterTextSplitter(separator="\n\n", chunk_size=120, chunk_overlap=0).split_text(text)):
    print(f"  {i}  {len(chunk):3} chars  {chunk[:70].replace(chr(10), ' ')}")

print("recursive  size=120  overlap=20")
for i, chunk in enumerate(RecursiveCharacterTextSplitter(chunk_size=120, chunk_overlap=20).split_text(text)):
    print(f"  {i}  {len(chunk):3} chars  {chunk[:70].replace(chr(10), ' ')}")
