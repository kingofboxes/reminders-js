CREATE TABLE Reminders (
	id              serial,
    member          bigint not null,
    start_time      bigint not null,
    end_time        bigint not null,
    description     text											
);