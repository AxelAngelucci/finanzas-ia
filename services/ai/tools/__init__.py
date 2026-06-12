from tools import transactions, budgets, goals, subscriptions, commitments, user

ALL_TOOLS = (
    transactions.TOOLS
    + budgets.TOOLS
    + goals.TOOLS
    + subscriptions.TOOLS
    + commitments.TOOLS
    + user.TOOLS
)

EXECUTORS = {
    # Transactions
    "create_transaction": transactions.create_transaction,
    "update_transaction": transactions.update_transaction,
    "delete_transaction": transactions.delete_transaction,
    "list_transactions": transactions.list_transactions,
    "get_monthly_summary": transactions.get_monthly_summary,
    # Budgets
    "create_budget": budgets.create_budget,
    "update_budget": budgets.update_budget,
    "delete_budget": budgets.delete_budget,
    "list_budgets": budgets.list_budgets,
    # Goals
    "create_goal": goals.create_goal,
    "update_goal": goals.update_goal,
    "delete_goal": goals.delete_goal,
    "list_goals": goals.list_goals,
    "deposit_to_goal": goals.deposit_to_goal,
    # Subscriptions
    "create_subscription": subscriptions.create_subscription,
    "list_subscriptions": subscriptions.list_subscriptions,
    "ignore_subscription": subscriptions.ignore_subscription,
    "delete_subscription": subscriptions.delete_subscription,
    # Commitments
    "create_commitment": commitments.create_commitment,
    "list_commitments": commitments.list_commitments,
    "mark_commitment_paid": commitments.mark_commitment_paid,
    "delete_commitment": commitments.delete_commitment,
    # User
    "update_user_preferences": user.update_user_preferences,
}
