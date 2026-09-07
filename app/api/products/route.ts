import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(params.get("pageSize") ?? 24)),
  );
  const search = params.get("search")?.trim();
  const brand = params.get("brand")?.trim();
  const color = params.get("color")?.trim();
  const sort = params.get("sort") ?? "price";
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("list-lcd")
    .select(
      'کد,نام,رنگ,برند,"قیمت فروش",wholesale_price,base_price,base_dollar',
      {
        count: "exact",
      },
    );
  if (search) {
    const numericCode = /^\d+$/.test(search) ? Number(search) : null;
    query =
      numericCode === null
        ? query.ilike("نام", `%${search}%`)
        : query.or(`نام.ilike.%${search}%,کد.eq.${numericCode}`);
  }
  if (brand) query = query.eq("برند", brand);
  if (color) query = query.eq("رنگ", color);
  if (sort === "name") query = query.order("نام", { ascending: true });
  else if (sort === "price")
    query = query.order("base_price", { ascending: false, nullsFirst: false });
  else query = query.order("کد", { ascending: true });

  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.error("[v0] Products fetch error:", error);

    return Response.json(
      {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
      { status: 500 },
    );
  }

  return Response.json({
    products: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
