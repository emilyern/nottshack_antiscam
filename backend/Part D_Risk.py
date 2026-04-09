# services/risk_engine.py

def risk_score(wallet_data):
    """
    Calculate risk score based on wallet data.

    Args:
        wallet_data (dict): {
            "new_wallet": bool,
            "transaction_count": int,
            "total_amount": float
        }

    Returns:
        dict: {"score": int, "level": str}
    """
    score = 0

    # Example scoring logic
    if wallet_data.get("new_wallet"):
        score += 1
    if wallet_data.get("transaction_count", 0) > 10:
        score += 1
    if wallet_data.get("total_amount", 0) > 1000:
        score += 2

    # Determine risk level
    if score <= 1:
        level = "🟢 low"
    elif score <= 3:
        level = "🟡 medium"
    else:
        level = "🔴 high"

    return {"score": score, "level": level}


# Example usage
if __name__ == "__main__":
    wallet = {"new_wallet": True, "transaction_count": 12, "total_amount": 500}
    print(risk_score(wallet))