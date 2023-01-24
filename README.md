# Bootcamp API

Based on Brad Traversy's Udemy Course

The API is deployed at https://dvn-bootcamps.herokuapp.com/api/V1

Documentation: https://dvn-bootcamps.herokuapp.com

# Improvements

These changes are functional improvements to the tutorial version.

## naming

- The "user" field of a course was renamed "owner"
- The "user" field of a review was renamed "author"

> More semantic

## avg tuition upate

Perform update average tuition in bootcamp not only on course add and delete, but also on course update

> without this there is no consistency, except if you disallow updating a course's price

Fix update of average tuition and average rating to an undefined value on delete of the last entitiy

> `findByIdAndUpdate(id, {averageCost: undefined})`, as used in the tutorial does not work; instead using the $unset operator

## advanced results: smarter `populate`

1.  `populate` considers `select`; refine `advancedResults` so that `populate` is only applied if not excluded by the `select` query param
2.  `populateArg` is `populateArgs` -> support multiple

> reduces payload to the minimum required

## bootcampsOwned virtual for User

When retrieving users, the data also contains bootcamps OWNED by each user.

> Convenient retrieval

## populate single bootcamp or user with virtuals

Not only when retrieving multiple, but also single entities, associated virtuals are populated.

- getBootcamp (populate courses within)
- getMe (populate owned bootcamps)
- getUser (populate owned bootcamps) - ADMIN only

> More convenient retrieval. May not be desirable depending on use cases (keeping payload at a minimum)

## user registration for bootcamp and add review authorization

The admin can register a user for a bootcamp. A bootcamp has a new field `participants`. Only these users are allowed to add a review for that bootcamp.

> In production we would use a different role, not admin, to authorize the user-to-bootcamp registration in production.
> That call would be made automatically upon confirmation of payment via an external payment service

## convenience endpoint for **bootcamps joined by user X**

All bootcamps joined by a user are included in the data when retrieving a user, but no redundant data is saved (user objects in DB have no notion of bootcamps where the user is registered)

For this we're creating a quasi-virtual field `bootcampsJoined`, which we populate using `**mongoose-fill**`, see [here](https://github.com/wclr/mongoose-fill).

## seeder index cleanup

Running `seeder.js -d` not only deletes the documents but also clears the indexes

> Was not necessary within the tutorial, but required for completeness of the cleanup

# 🚧 TODO for consistent functionality

- ensure no rules are violated when changing a user's role

  - if they're a publisher they can't become a regular user unless they have no owned bootcamp
  - if they're a user they can't become a publisher unless they have no joined bootcamps

- one more virtual for retrieved users: all authored reviews

# 🚧 TODO

## Redefine business entities & use case

Bootcamp = Disinfo Festival
Course = Event (Workshop / Masterclass / Propaganda Entertainment / Inspirational)
Review = Review

Roles:

- Admin
- Journalist
- Organizer

Persist participation, require participation for writing Reviews (?) or NOT : write whatever, do the disinfo

Admin enrolls participant to Event (participant can be journalist or organizer)
Owner of event marks participant as graduated (owner must be an organizer)

## REFACTOR organize into features, then routes-controllers-views

## Version with Postgres
