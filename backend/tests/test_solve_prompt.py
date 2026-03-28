from app.services.gemini import SOLVE_PROMPT


def test_solve_prompt_instructs_inline_latex():
    """Prompt must tell Gemini to use $...$ for inline math."""
    assert "$" in SOLVE_PROMPT, "Prompt must contain $ for inline LaTeX"


def test_solve_prompt_instructs_display_latex():
    """Prompt must tell Gemini to use $$...$$ for display math."""
    assert "$$" in SOLVE_PROMPT, "Prompt must contain $$ for display LaTeX"


def test_solve_prompt_mentions_latex():
    """Prompt must explicitly name LaTeX so Gemini uses proper notation."""
    assert "LaTeX" in SOLVE_PROMPT, "Prompt must mention 'LaTeX'"


def test_solve_prompt_instructs_markdown():
    """Prompt must instruct Markdown text formatting."""
    assert "Markdown" in SOLVE_PROMPT or "**bold**" in SOLVE_PROMPT, \
        "Prompt must mention Markdown formatting"
