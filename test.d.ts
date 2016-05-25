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