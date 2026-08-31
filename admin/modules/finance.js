(function () {
  const summarize = (items, monthKey) => {
    const entries = monthKey ? (items || []).filter((item) => String(item.occurredOn || "").startsWith(monthKey)) : (items || []);
    const incomeItems = entries.filter((item) => item.entryType === "income");
    const expenseItems = entries.filter((item) => item.entryType === "expense");
    const income = incomeItems.reduce((sum, item) => sum + Number(item.paidAmountCents || item.amountCents || 0), 0);
    const contract = incomeItems.reduce((sum, item) => sum + Number(item.contractAmountCents || item.amountCents || 0), 0);
    const expense = expenseItems.reduce((sum, item) => sum + Number(item.amountCents || 0), 0);
    return { entries, incomeItems, expenseItems, income, contract, expense, outstanding: Math.max(0, contract - income), balance: income - expense };
  };
  const prepareEntry = (values) => {
    const entry = { ...values };
    entry.amountCents = Math.round(Number(entry.amount) * 100);
    if (!Number.isFinite(entry.amountCents) || entry.amountCents <= 0) throw new Error("请输入正确的金额");
    entry.contractAmountCents = Math.round(Number(entry.contractAmount || 0) * 100);
    entry.paidAmountCents = Math.round(Number(entry.paidAmount || 0) * 100);
    if (entry.entryType === "expense") {
      entry.contractAmountCents = 0;
      entry.paidAmountCents = 0;
      entry.paymentStatus = "paid";
    }
    delete entry.amount;
    delete entry.contractAmount;
    delete entry.paidAmount;
    return entry;
  };
  window.PortfolioAdminFinance = { summarize, prepareEntry };
})();
