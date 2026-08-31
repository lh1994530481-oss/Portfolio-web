(function () {
  const inquiryStatusNames = { new: "待处理", read: "已查看", replied: "已回复", closed: "已关闭" };
  const quoteStatusNames = { new: "待评估", reviewed: "已评估", converted: "已成交", closed: "已关闭" };
  const filter = (items, query, status, fields) => {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    return (items || []).filter((item) => {
      if (status && status !== "all" && item.status !== status) return false;
      return !normalizedQuery || fields(item).some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    });
  };
  const filterInquiries = (items, query, status) => filter(items, query, status, (item) => [
    item.name, item.contact, item.email, item.projectType, (item.projectTypes || []).join(" "), item.budget, item.message,
  ]);
  const filterQuotes = (items, query, status) => filter(items, query, status, (item) => [
    item.name, item.contact, item.budget, item.details, (item.projectTypes || []).join(" "),
  ]);
  window.PortfolioAdminLeads = { inquiryStatusNames, quoteStatusNames, filterInquiries, filterQuotes };
})();
