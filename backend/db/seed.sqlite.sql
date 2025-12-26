-- Seed data to match the JSON fallback defaults.

insert into menu_items (id, name, minutes)
values
  ('m1', 'Grilled Salmon', 25),
  ('m2', 'Caesar Salad', 15),
  ('m3', 'Pasta Carbonara', 30),
  ('m4', 'Beef Wellington', 45)
on conflict (id) do update
set
  name = excluded.name,
  minutes = excluded.minutes;
