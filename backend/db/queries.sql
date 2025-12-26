-- Example queries for the Cook endpoints.

-- Menu: GET /api/cook/menu
select id, name, minutes
from public.menu_items
order by id;

-- Status by date: GET /api/cook/status?date=YYYY-MM-DD
-- selectedMenuIds = all menu_id rows; doneIds = menu_id where done=true
select menu_id, done
from public.cook_day_menu
where day_date = date '2025-12-24'
order by menu_id;

-- Save status: PUT /api/cook/status?date=YYYY-MM-DD
-- (Backend implementation: replace-all for that day)
delete from public.cook_day_menu
where day_date = date '2025-12-24';

insert into public.cook_day_menu (day_date, menu_id, done)
values
  (date '2025-12-24', 'm1', false),
  (date '2025-12-24', 'm2', true);
