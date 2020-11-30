CREATE TABLE Reminders (
    member          bigint not null,
    start_time      bigint not null,
    end_time        bigint not null,
    description     text,
    primary key(start_time, end_time)											
);

ALTER TABLE public.reminders OWNER to USERNAME;