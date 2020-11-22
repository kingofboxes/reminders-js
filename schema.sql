CREATE TABLE Reminders (
	id              serial,
    member          integer not null,
    start_time      integer not null,
    end_time        integer not null,
    description     text											
);