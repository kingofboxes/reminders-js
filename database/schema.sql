CREATE TABLE Reminders (
    member          bigint not null,
    start_time      bigint not null,
    end_time        bigint not null,
    description     text,
    primary key(start_time, end_time)											
);

CREATE TABLE Subscriptions (
    member          bigint not null,
    ics_url         text,
    primary key(member, ics_url)	
);