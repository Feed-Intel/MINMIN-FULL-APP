export const buildQueryParams = (filters: {
  category: string;
  min_price: string;
  max_price: string;
  tags: string;
}) => {
  const queryParts: string[] = [];

  // Process categories with comma separation and original formatting
  if (filters.category) {
    const categories = filters.category
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat);

    if (categories.length > 0) {
      const encodedCategories = categories
        .map((cat) => encodeURIComponent(cat))
        .join(",");
      queryParts.push(`category=${encodedCategories}`);
    }
  }

  // Process other parameters using URLSearchParams
  const otherParams = new URLSearchParams();

  if (filters.min_price) otherParams.append("min_price", filters.min_price);
  if (filters.max_price) otherParams.append("max_price", filters.max_price);

  if (filters.tags) {
    const formattedTags = filters.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
      .join(",");
    otherParams.append("tags", formattedTags);
  }

  const otherParamsString = otherParams.toString();
  if (otherParamsString) {
    queryParts.push(otherParamsString);
  }

  return queryParts.join("&");
};
