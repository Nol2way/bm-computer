-- =====================================================================
-- ทำให้คะแนน/จำนวนรีวิวตรงกับความจริง (seed catalog ใส่เลขมั่วไว้)
-- สินค้าที่ไม่มีรีวิว -> reviews_count=0, rating=null (หน้าเว็บโชว์ "ยังไม่มีรีวิว")
-- trigger จากระบบรีวิวจะดูแลค่าพวกนี้ต่อเองเมื่อมีรีวิวจริง
-- =====================================================================

update public.products p set
  reviews_count = coalesce(r.cnt, 0),
  rating = r.avg
from (
  select product_id, count(*)::int as cnt, round(avg(rating)::numeric, 1) as avg
  from public.reviews group by product_id
) r
where p.id = r.product_id;

update public.products set reviews_count = 0, rating = null
where id not in (select distinct product_id from public.reviews where product_id is not null);
