# TStranslator

The TStranslator is a translator from TypeScript definitions to C# definitions. It parses the AST (Abstract Syntax Tree) of TypeScript and do the work using the TypeScript Compiler API.

To run the project you will need to install TypeScript >=1.6 from `npm`. To use `npm` you must have nodejs installed. 

To install TypeScript >=1.6 run this:

```
npm install -g typescript
```

Once TypeScript is installed you need link it to the project, from the project folder run this:

```
npm link typescript
```

To try run:

```
tsc cs.translator.ts 
node cs.translator.js test.d.ts
```

Passing an input like:

```ts
namespace People {
	interface Person {
	    firstName: string;
	    lastName: string;
	    approved: boolean;
	}

	class Student implements Person{
	    fullName: string;	    
        constructor(firstName: any, middleInitial: any, lastName: any);
	    getNotes(): {};
        changeName(fullName: string): void;
        isApproved(): boolean;
	}
}
```

We should get output like:

```cs
namespace People
{
    interface Person
    {
        string firstName;
        string lastName;
        bool approved;
    }
    class Student : Person
    {
        string fullName;
        public Student(dynamic firstName, dynamic middleInitial, dynamic lastName);
        dynamic getNotes();
        void changeName(string fullName);
        bool isApproved();
    }
}
```

